export default function downloadBlob(data: Blob | MediaSource, fileName: string) {
    const downloadElement: HTMLAnchorElement | null = document.getElementById("downloadATagUnderBody") as HTMLAnchorElement | null;
    if (downloadElement === null) throw new Error("Data is empty.");
    const url = URL.createObjectURL(data);
    downloadElement.href = url;
    downloadElement.download = fileName;
    downloadElement.click();
    downloadElement.href = "";
    downloadElement.download = "";
    URL.revokeObjectURL(url);
}
