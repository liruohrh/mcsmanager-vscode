const vscode = acquireVsCodeApi();
const terminal = new Terminal({
    fontSize: 14,
    fontFamily: 'Consolas, "Courier New", monospace',
    theme: {
        background: "#1e1e1e",
        foreground: "#d4d4d4",
    },
    allowTransparency: true,
    copyOnSelect: true,
});

const fitAddon = new FitAddon.FitAddon();
const searchAddon = new SearchAddon.SearchAddon();
const webLinksAddon = new WebLinksAddon.WebLinksAddon();

terminal.loadAddon(fitAddon);
terminal.loadAddon(searchAddon);
terminal.loadAddon(webLinksAddon);

terminal.open(document.getElementById("terminal"));

fitAddon.fit();

// 搜索相关函数
function findNext() {
    const searchInput = document.getElementById("searchInput");
    searchAddon.findNext(searchInput.value);
}

function findPrevious() {
    const searchInput = document.getElementById("searchInput");
    searchAddon.findPrevious(searchInput.value);
}

function closeSearch() {
    searchBox.style.display = "none";
    searchAddon.clearDecorations();
}

// 添加快捷键支持
document.addEventListener("keydown", (e) => {
    // Ctrl+F 打开搜索
    if (e.ctrlKey && e.key === "f") {
        e.preventDefault();
        searchBox.style.display = "block";
        document.getElementById("searchInput").focus();
    }
    // Ctrl+C 或 Ctrl+Insert 复制
    if ((e.ctrlKey && e.key === "c") || (e.ctrlKey && e.key === "Insert")) {
        const selection = terminal.getSelection();
        if (selection) {
            e.preventDefault();
            navigator.clipboard.writeText(selection);
        }
    }
});

// 搜索框回车键支持
document.getElementById("searchInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        e.preventDefault();
        if (e.shiftKey) {
            findPrevious();
        } else {
            findNext();
        }
    }
    if (e.key === "Escape") {
        closeSearch();
    }
});

// 监听窗口大小变化
window.addEventListener("resize", (e) => {
    fitAddon.fit();
});

// 添加按钮的事件处理
const clearButton = document.getElementById("clearButton");
const allButton = document.getElementById("allButton");
const exportButton = document.getElementById("exportButton");

// 响应式布局处理
const buttonGroup = document.querySelector(".button-group");
const dropdownContent = document.querySelector(".dropdown-content");
const actionButtons = document.querySelectorAll(".action-button");

// 初始化下拉菜单内容
actionButtons.forEach((button) => {
    const clonedButton = document.createElement("button");
    clonedButton.textContent = button.textContent;
    clonedButton.onclick = () => button.click();
    dropdownContent.appendChild(clonedButton);
});

clearButton.onclick = () => {
    terminal.clear();
};

allButton.onclick = () => {
    vscode.postMessage({
        eventType: "fetchAllHistory",
    });
};

exportButton.onclick = () => {
    let text = "";
    for (let i = 0; i < terminal.buffer.active.length; i++) {
        const line = terminal.buffer.active.getLine(i);
        if (line) {
            text += line.translateToString() + "\n";
        }
    }
    vscode.postMessage({
        eventType: "exportTerminal",
        text: text,
    });
};

// 历史命令相关
let commandHistory = JSON.parse(localStorage.getItem("commandHistory") || "[]");
let historyIndex = -1;
const commandInput = document.getElementById("commandInput");
const historyButton = document.getElementById("historyButton");
const historyPanel = document.getElementById("historyPanel");

// 添加命令到历史记录
function addToHistory(command) {
    if (command) {
        // 先删除已存在的相同命令
        const index = commandHistory.indexOf(command);
        if (index !== -1) {
            commandHistory.splice(index, 1);
        }
        // 添加到历史记录开头
        commandHistory.unshift(command);
        if (commandHistory.length > 100) {
            commandHistory.pop();
        }
        localStorage.setItem("commandHistory", JSON.stringify(commandHistory));
        // 更新历史命令面板
        updateHistoryPanel();
    }
}

// 更新历史命令面板
function updateHistoryPanel() {
    historyPanel.innerHTML = "";
    commandHistory.forEach((cmd) => {
        const item = document.createElement("div");
        item.className = "history-item";
        item.textContent = cmd;
        item.onclick = () => {
            commandInput.value = cmd;
            historyPanel.style.display = "none";
            commandInput.focus();
        };
        historyPanel.appendChild(item);
    });
}

// 监听输入框事件
commandInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && commandInput.value.trim()) {
        const command = commandInput.value;
        vscode.postMessage({
            eventType: "sendCommand",
            text: command,
        });
        addToHistory(command);
        commandInput.value = "";
        historyIndex = -1;
    } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (historyIndex < commandHistory.length - 1) {
            historyIndex++;
            commandInput.value = commandHistory[historyIndex];
        }
    } else if (e.key === "ArrowDown") {
        e.preventDefault();
        if (historyIndex > -1) {
            historyIndex--;
            commandInput.value =
                historyIndex === -1 ? "" : commandHistory[historyIndex];
        }
    }
});

// 搜索按钮点击事件
const searchButton = document.getElementById("searchButton");

searchButton.onclick = () => {
    searchBox.style.display = "block";
    document.getElementById("searchInput").focus();
};

// 历史命令按钮点击事件
historyButton.onclick = () => {
    updateHistoryPanel();
    historyPanel.style.display =
        historyPanel.style.display === "none" ? "block" : "none";
};

// 点击其他地方关闭历史命令面板
document.addEventListener("click", (e) => {
    if (!historyPanel.contains(e.target) && e.target !== historyButton) {
        historyPanel.style.display = "none";
    }
});

// 监听来自服务器的消息
window.addEventListener("message", (event) => {
    const message = event.data;
    if (message.eventType === "terminalText") {
        terminal.write(message.data);
    } else if (message.eventType === "clearTerminal") {
        terminal.clear();
    }
});
