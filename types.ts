export type ProtocolVersion = 14

export type ArtNetPollReplyPacketPayload ={
    ipAddress: number[];
    port: number;
    firmwareVersion: number;
    netSwitch: number;
    oem: number;
    ubeaVersion: number;
    status1: number;
    estaManufactorerCode: number;
    shortName: string;
    longName: string;
    nodeReport: string;
    numPorts: number;
    portTypes: number[];
    goodInput: number[];
    goodOutputA: number[];
    swIn: number[];
    swOut: number[];
    acnPriority: number;
    swMacro: number;
    swRemote: number;
    spare: number[];
    style: number;
    macAddress: number[];
    bindIp: number[];
    bindIndex: number;
    status2: number;
    goodOutputB: number;
    status3: number;
    defaultRespUID: number[];
    filler: number[];
};

export type ArtNetDmxPacketPayload = {
    protoVersion: ProtocolVersion;
    sequence: number;
    physical: number;
    net: number;
    subUniverse: number;
    length: number;
    dmxData: number[];
};

export type ArtNetPollPacketPayload = {
    protoVersion: ProtocolVersion;
    flags: number;
    diagPriority: number;
    targetPortAddressTop: number;
    targetPortAddressBottom: number;
};

export type ArtNetHeaderPayload = {
    ID: string;
    opCode: number;
};

export interface IArtNetPacketSchemeRecord {
    length: number;
    byteOrder?: 'LE' | 'BE';
    type: 'string' | 'number' | 'array';
    default?: number | string | number [];
}

export interface IArtNetBridge {
    ipAddress: string;
    macAddress: string;
    bridgeName: string;
    lastPollingTime: Date;
}

export interface IArtNetLightEmitter {
    set bridge(bridge: IArtNetBridge);

    get bridge(): IArtNetBridge;

    setBrightness?: (percent: number) => void;
    setColorTemperature?: (kelvins: number) => void;
    setHUE?: (degrees: number) => void;
    setLightDiffusion?: (mode: 'HARD' | 'SOFT') => void;
    setGreenMagentaBias?: (bias: number) => void;
    setLightMode?: (mode: 'SILENT' | 'BOOST' | 'NORMAL') => void;
    setSaturation?: (percent: number) => void;
    runCCTLoop?: (fromCCT?: number, toCCT?: number, ...arg: any[]) => void;
    sendData: (...args: any[]) => void;
}

export type PacketPayloadType = string | number | number[];
export type ArtNetPacketPayload = Record<string, PacketPayloadType>;
export type ArtNetPacketScheme = Record<string, IArtNetPacketSchemeRecord>

export type ArtnetPollPacketScheme = Record<keyof ArtNetPollPacketPayload, IArtNetPacketSchemeRecord>
export type ArtnetDmxPacketScheme = Record<keyof ArtNetDmxPacketPayload, IArtNetPacketSchemeRecord>
export type ArtnetPollReplyPacketScheme = Record<keyof ArtNetPollReplyPacketPayload, IArtNetPacketSchemeRecord>
export type ArtnetHeaderScheme = Record<keyof ArtNetHeaderPayload, IArtNetPacketSchemeRecord>

