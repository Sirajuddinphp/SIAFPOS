import { contextBridge } from "electron";
import { posApi } from "./api";

contextBridge.exposeInMainWorld("pos", posApi);
