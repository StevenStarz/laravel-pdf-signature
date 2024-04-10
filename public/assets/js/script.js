var pdfAnnotate = new PDFAnnotate("documentRender", "", {
    onPageUpdated(page, oldData, newData) {
        console.log(page, oldData, newData);
    },
    ready() {
        console.log("Plugin initialized successfully");
    }
});

function addImage(event) {
    event.preventDefault();
    pdfAnnotate.addImageToCanvas()
}

function deleteSelectedObject(event) {
    event.preventDefault();
    pdfAnnotate.deleteSelectedObject();
}

function savePDF() {
    pdfAnnotate.savePdf('sample.pdf'); // save with given file name
}

function clearPage() {
    pdfAnnotate.clearActivePage();
}
