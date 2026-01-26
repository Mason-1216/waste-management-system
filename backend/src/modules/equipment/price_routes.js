import priceController from '../../controllers/priceController.js';
import { checkPriceAdmin } from '../../middlewares/permission.js';

export const registerPriceRoutes = (router) => {
  router.get('/prices', priceController.getPrices);
  router.get('/prices/all', priceController.getAllPrices);
  router.get('/prices/categories', priceController.getPriceCategories);
  router.post('/prices', checkPriceAdmin, priceController.createPrice);
  router.put('/prices/:id', checkPriceAdmin, priceController.updatePrice);
  router.delete('/prices/:id', checkPriceAdmin, priceController.deletePrice);
};
