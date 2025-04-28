// 气泡提示相关函数
function showToast(message, position = "top", duration = 2000) {
    const container = document.querySelector(".toast-container");
    container.className = `toast-container ${position}`;

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add("show");
    }, 10);

    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => {
            container.removeChild(toast);
        }, 300);
    }, duration);
}
