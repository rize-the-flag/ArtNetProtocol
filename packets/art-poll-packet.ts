import {ArtNetPacket} from "./art-net-packet";
import {ArtnetPollPacketScheme, ArtNetPollPacketPayload} from '../types'
import {PacketBuilder} from './packet-builder'
import {PROTOCOL_VERSION, OP_CODE} from '../constants'


export class ArtNetPollPacket extends ArtNetPacket<Partial<ArtNetPollPacketPayload>> {

    private artNetPollScheme: ArtnetPollPacketScheme = {
        protoVersion: {length: 2, type: 'number', byteOrder: 'BE'},
        flags: {length: 1, type: 'number'},
        diagPriority: {length: 1, type: 'number'},
        targetPortAddressTop: {length: 2, type: 'number', byteOrder: 'BE'},
        targetPortAddressBottom: {length: 2, type: 'number', byteOrder: 'BE'}
    }

    constructor(payload: Partial<ArtNetPollPacketPayload> = {}) {
        super(OP_CODE.OP_POLL, payload);
        this.packetPayload.protoVersion = PROTOCOL_VERSION;
        this.packetPayload.flags = payload?.flags || 0b00000110;
        this.packetPayload.diagPriority = payload?.diagPriority || 0;
        this.packetPayload.targetPortAddressBottom = payload?.targetPortAddressBottom || 0;
        this.packetPayload.targetPortAddressTop = payload?.targetPortAddressBottom || 0;
    }

    protected build(): Buffer {
        return PacketBuilder.encode(this.packetPayload, this.artNetPollScheme);
    }
}
