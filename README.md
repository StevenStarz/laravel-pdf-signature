### Laravel PDF Signature + PDF.js + PDF Viewer.js + Fabric JS / Stamp Annotation

![Untitled](https://prod-files-secure.s3.us-west-2.amazonaws.com/ad117d35-5038-4c07-959f-32be9097ebc8/4ee8d847-da30-4cf2-b421-5813bbd9ed01/Untitled.png)

![Untitled](https://prod-files-secure.s3.us-west-2.amazonaws.com/ad117d35-5038-4c07-959f-32be9097ebc8/13406723-f241-4d5d-ab56-01f170efb1ce/Untitled.png)

![Untitled](https://prod-files-secure.s3.us-west-2.amazonaws.com/ad117d35-5038-4c07-959f-32be9097ebc8/75975383-3642-4deb-82c4-ea05ff4e7ad8/Untitled.png)

Laravel PDF Signature, a tool created using PDF.js, PDF Viewer.js and Fabric JS, is designed to offer an efficient and convenient way to sign PDF documents. One of its key features is lazy loading, which makes it particularly suitable for handling large PDF files. This feature ensures that the tool only loads the necessary parts of the file, making it significantly faster and more efficient.

The tool offers both mobile and desktop versions, ensuring accessibility regardless of the device being used. This makes it easier for users to access and use the tool at their convenience, whether they're at their desk or on the go.

Another notable feature is the stamp annotation. Users can add a stamp annotation or a signature to their documents. The signatures are draggable and resizable, offering a high level of customization to meet varied user needs. Multiple signatures on multiple pages are supported, making it ideal for documents that require the signatures of several parties.

The tool also provides the option to load with a file or with base64, offering flexibility in terms of how documents can be uploaded and processed. This is particularly useful for users who may have different preferences or requirements for uploading files.

Finally, the Laravel PDF Signature tool allows for PDF downloads. Once a document has been signed or annotated as required, users can easily download the final, signed version for their records. This tool, built with Laravel, Fabric Js, PDF.js, and PDF Viewer.js, is a comprehensive solution for PDF signing needs.

Features:
- Load by Scroll / Lazy loading, suitable for BIG PDF Files
- Mobile Version / Desktop Version
- Add Stamp Annotation / Add Signature
- Draggable Signature
- Download PDF
- Resizeable Signature
- Multi signature on multi page
- Load with file / Load with base64

Build with:
- Laravel
- Fabric Js
- PDF.js
- PDF Viewer.js

## Installation

```
- composer install
- php artisan key:generate
- php artisan storage:link
```

Current Theme Color
#6f42c1

Load PDF from File

```
/
```

Load PDF from base64

```
/base64
```
