export function formatFileSize(size: number): string {
    if (size < 1024) {
        return `${size} B`;
    } else if (size < 1024 * 1024) {
        return `${(size / 1024).toFixed(1)} KB`;
    } else if (size < 1024 * 1024 * 1024) {
        return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    } else {
        return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    }
}

export function isCompressedFile(filename: string): boolean {
    const ext = filename.slice(filename.lastIndexOf(".")).toLowerCase();
    return compressedExtensions.includes(ext);
}

const compressedExtensions = [
    ".zip",
    ".zipx",
    ".rar",
    ".rev",
    ".7z",
    ".tar",
    ".gz",
    ".tgz",
    ".bz2",
    ".tbz2",
    ".xz",
    ".txz",
    ".lz",
    ".lzma",
    ".tlz",
    ".z",
    ".tz",
    ".arj",
    ".cab",
    ".dmg",
    ".iso",
    ".jar",
    ".war",
    ".ear",
    ".pak",
    ".pk3",
    ".pk4",
    ".deb",
    ".rpm",
    ".sit",
    ".sitx",
    ".zoo",
    ".arc",
    ".wim",
    ".uu",
    ".uue",
    ".hqx",
    ".bin",
    ".img",
    ".vhd",
    ".vmdk",
    ".egg",
    ".alz",
    ".apk",
    ".ipa",
    ".xap",
    ".msi",
    ".crx",
    ".epub",
    ".cbz",
    ".cbr",
];
