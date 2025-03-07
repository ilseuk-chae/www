class UploadAdapter {
    constructor(loader) {
        this.loader = loader;
    }

    upload() {
        return this.loader.file.then(
            (file) =>
                new Promise((resolve, reject) => {
                    this._initRequest();
                    this._initListeners(resolve, reject, file);
                    this._sendRequest(file);
                })
        );
    }

    _initRequest() {
        const xhr = (this.xhr = new XMLHttpRequest());
        xhr.open("POST", "/admin/back/00-include/upload_editor_image.php", true);
        xhr.responseType = "json";
    }

    _initListeners(resolve, reject, file) {
        const xhr = this.xhr;
        const loader = this.loader;
        const genericErrorText = "파일을 업로드 할 수 없습니다.";

        xhr.addEventListener("error", () => {
            reject(genericErrorText);
        });
        xhr.addEventListener("abort", () => reject());
        xhr.addEventListener("load", () => {
            const response = xhr.response;
            console.log(response);
            if (!response || response.error || response.result !== "success") {
                return reject(response && response.error ? response.error.message : genericErrorText);
            }

            setCookie("uploadFolder", response.uploadFolder);

            resolve({
                default: response.url, //업로드된 파일 주소
            });
        });
    }

    _sendRequest(file) {
        const data = new FormData();
        data.append("uploadFile[]", file);
        data.append("uploadFolder", getCookie("uploadFolder"));
        this.xhr.send(data);
    }
}
