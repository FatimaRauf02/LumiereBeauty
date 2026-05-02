import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import productsRouter from "./products";
import cartRouter from "./cart";
import ordersRouter from "./orders";
import reviewsRouter from "./reviews";
import quizRouter from "./quiz";
import wishlistRouter from "./wishlist";
import chatRouter from "./chat";
import accountRouter from "./account";
import adminRouter from "./admin";
import newsletterRouter from "./newsletter";
import couponsRouter from "./coupons";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(productsRouter);
router.use(cartRouter);
router.use(ordersRouter);
router.use(reviewsRouter);
router.use(quizRouter);
router.use(wishlistRouter);
router.use(chatRouter);
router.use(accountRouter);
router.use("/admin", adminRouter);
router.use(newsletterRouter);
router.use(couponsRouter);

export default router;
