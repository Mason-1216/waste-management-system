import uploadController from '../../controllers/uploadController.js';
import { uploadToDisk } from '../../config/upload.js';

export const registerUploadRoutes = (router) => {
  router.post('/upload', uploadToDisk.single('file'), uploadController.uploadSingle);
  router.post('/upload/multiple', uploadToDisk.array('files', 10), uploadController.uploadMultiple);
};
