import {ArtnetHeaderScheme, ArtNetPacketPayload} from '../types'
import {PacketBuilder} from './packet-builder'
import {ARTNET_PACKET_ID, OP_CODE} from '../constants'

export abstract class ArtNetPacket<T extends Partial<ArtNetPacketPayload>> {

    private static artNetHeaderScheme: ArtnetHeaderScheme = {
        ID: {length: 8, type: 'string'},
        opCode: {length: 2, type: 'number', byteOrder: 'LE'},
    }

    protected constructor(
        private opCode: OP_CODE,
        protected packetPayload: T) {
    }

    encode(): Buffer {
        const header = PacketBuilder.encode({
            ID: ARTNET_PACKET_ID,
            opCode: this.opCode,
        }, ArtNetPacket.artNetHeaderScheme)
        return Buffer.from([...header, ...this.build()])
    }

    static getHeaderLength(): number {
        const {ID, opCode} = this.artNetHeaderScheme;
        return ID.length + opCode.length;
    }

    protected abstract build(): Buffer;
}