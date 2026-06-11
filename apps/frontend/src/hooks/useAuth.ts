import { MainContext } from "@/context/MainContext";
import { useContext } from "react";

export const useAuth = () => {
    const context = useContext(MainContext);
    if (!context) throw new Error("useAuth must be used within MainProvider");
    return context;
};