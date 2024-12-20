"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res
                .status(401)
                .json({ message: "Authorization header is missing" });
        }
        const token = authHeader.split(" ")[1];
        if (!token) {
            return res.status(401).json({ message: "Token is missing" });
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JSON_SECRET);
        if (!decoded) {
            return res.status(401).json({ message: "Unable to decode Token" });
        }
        // @ts-ignore
        console.log(decoded, decoded.id);
        // @ts-ignore
        req.userId = decoded.id;
        next();
    }
    catch (err) {
        return res.status(403).json({ message: "Invalid token" });
    }
};
exports.default = authMiddleware;
