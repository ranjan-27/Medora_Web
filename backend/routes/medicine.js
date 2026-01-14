const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const medicineController = require("../controllers/medicineController");

// Helper to safely wrap auth + handler so router receives a single function.
function routeHandler(auth, handler) {
	return async (req, res, next) => {
		try {
			// Run auth if provided
			if (typeof auth === "function") {
				await new Promise((resolve, reject) => {
					// auth middleware calls next(); we treat any passed value as error
					auth(req, res, (err) => (err ? reject(err) : resolve()));
				});
			} else if (auth != null) {
				console.warn("⚠️ auth is not a function for route", req.path, typeof auth);
			}

			// Run handler
			if (typeof handler === "function") return handler(req, res, next);

			console.error("❌ Route handler is not a function for", req.path, typeof handler);
			res.status(500).json({ error: "Route handler is not available" });
		} catch (err) {
			next(err);
		}
	};
}

router.post("/", routeHandler(authMiddleware, medicineController.addMedicine));
router.get("/", routeHandler(authMiddleware, medicineController.getMedicines));
router.put("/:id", routeHandler(authMiddleware, medicineController.updateMedicine));
router.delete("/:id", routeHandler(authMiddleware, medicineController.deleteMedicine));
router.post("/:id/taken", routeHandler(authMiddleware, medicineController.markTaken));
router.post("/:id/missed", routeHandler(authMiddleware, medicineController.markMissed));


module.exports = router;
