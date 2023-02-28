import {ARTNET_DEVICE_MAP} from "./register-devices";

export type ART_NET_DEVICE_TYPE = typeof ARTNET_DEVICE_MAP

export class ArtnetDeviceFactory {
    static createDevice<T extends keyof ART_NET_DEVICE_TYPE>(type: T): ART_NET_DEVICE_TYPE[T] {
        return ARTNET_DEVICE_MAP[type]
    }
}

