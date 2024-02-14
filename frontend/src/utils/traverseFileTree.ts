export default function traverseFileTree(item: FileSystemEntry, path?: string, callback?: (file: File) => void) {
    path = path || "";
    if (item.isFile) {
        const file = item as FileSystemFileEntry;
        if (callback) file.file(file_r => {
            callback(new File([file_r], file.fullPath.slice(1)));
        });
    } else if (item.isDirectory) {
        const directory = item as FileSystemDirectoryEntry;
        var dirReader = directory.createReader();
        dirReader.readEntries(entries => entries.forEach(
            entry => traverseFileTree(entry, path + directory.name + "/", callback)
        ));
    }
};
