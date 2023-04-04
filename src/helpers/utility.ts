import { useState } from "react";

export interface MediaConfig {
    maxCount: number;
    name: string;
    multiple: boolean;
    normalize?: (item: any) => any;
};

export interface ValuePropsConfig {
    data: any;
    imageUrl: string;
    getFileUrl?: ((item: any) => any);
    getFileTitle?: ((item: any) => any);
};


export const getValueProps = (valueProps: ValuePropsConfig) => {
    const { data, imageUrl, getFileUrl, getFileTitle } = valueProps;

    if (!data) {
        return { fileList: [] };
    }

    const files = {
        file: data.file,
        fileList:
            data.fileList ??
            (Array.isArray(data) ? data : [data]).map((item: any) => {

                const file: any = {
                    name: getFileTitle ? getFileTitle(item) : item.title,
                    url: getFileUrl ? getFileUrl(item) : `${imageUrl}assets/${item.id}`,
                    percent: item.percent,
                    size: item.filesize,
                    status: 'done',
                    type: item.type,
                    uid: item.id
                };

                return file;

            }),
    };

    return files;
};


export const useDirectusUpload = (mediaConfigList: MediaConfig[], directusClient: any) => {
    const [uploadedFileIds] = useState<string[]>([]);
    const [fileList, setFileList] = useState<any[]>([]);

    const beforeUpload = (_file: any, files: any[], maxCount: number): boolean => {
        const totalFiles = fileList.length;
        const filesCount = files.length;

        if (totalFiles + filesCount > maxCount) {
            const excessFileCount = totalFiles + filesCount - maxCount;
            // convert negative
            const deleteItemCount = excessFileCount - excessFileCount * 2;
            files.splice(deleteItemCount);
        }

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        setFileList([...fileList, ...files]);

        return true;
    };


    const customRequest = async ({
        file,
        onError,
        onSuccess,
    }: any) => {
        try {
            const form = new FormData();
            form.append("file", file);

            const data = await directusClient.files.createOne(form);
            onSuccess?.({ data }, new XMLHttpRequest());
        } catch (error) {
            onError?.(new Error("Upload Error"));
        }
    };


    const getUploadProps = (fieldName: string) => {

        const mediaConfig = mediaConfigList.filter((config: any) => config.name === fieldName)[0];

        return {
            uploadedFileIds,
            beforeUpload: (_file: any, files: any[]) => beforeUpload(_file, files, mediaConfig.maxCount),
            fileList,
            maxCount: mediaConfig.maxCount,
            customRequest,
        };
    };

    return getUploadProps;
};


export const mediaUploadMapper = (params: any, mediaConfigList: MediaConfig[]) => {

    for (const item of Object.keys(params)) {
        if (params[item]) {
            const param = params[item].fileList;
            const isMediaField = Array.isArray(param);
            if (isMediaField) {
                const mediaConfig = mediaConfigList.filter((config: any) => config.name === item)[0];
                const ids = [];
                for (const key of Object.keys(param)) {
                    if (param[key].response) {
                        if (mediaConfig.normalize) {
                            ids.push(mediaConfig.normalize(param[key].response.data.id));
                        }
                        else {
                            ids.push(param[key].response.data.id);
                        }
                    } else {
                        ids.push(param[key].uid);
                    }
                }

                if (mediaConfig.multiple) {
                    params[item] = ids;
                }
                else {
                    params[item] = ids[0];
                }
            }
        }
    }

    return params;
};