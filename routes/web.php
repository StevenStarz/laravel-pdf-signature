<?php

use Illuminate\Support\Facades\Route;
use Symfony\Component\HttpFoundation\File\File;
use Illuminate\Http\UploadedFile;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

Route::get("/", function () {
    return view("welcome", [
        "filepath" => "web/compressed.tracemonkey-pldi-09.pdf"
    ]);
});
Route::get("/base64", function () {
    $base64 = config("base64")["data"];

    if(is_string($base64)){
        if (is_string($base64) && ($file = base64_to_file_or_false($base64))) {
            $filePath = 'public/document/'.$file->hashName();
            $file->storeAs('public/document/', $file->hashName());
            $filename = $file->hashName();
        }
    }
    $filePath = 'storage/document/' . $filename;

    return view("welcome", [
        "filepath" => asset($filePath)
    ]);
});

function base64_to_file_or_false(?string $base64)
{
    $file = false;

    try {
        if (strpos($base64, ';base64') !== false) {
            [, $base64] = explode(';', $base64);
            [, $base64] = explode(',', $base64);
        } else {
            return false;
        }

        $tmpFilePath = stream_get_meta_data(tmpfile())['uri'];

        file_put_contents($tmpFilePath, base64_decode($base64));

        $file = new File($tmpFilePath);

        return new UploadedFile($file->getPathname(), $file->getFilename(), $file->getMimeType());
        //
    } catch (\Exception $e) {
        return false;
    }

    return $file;
}
