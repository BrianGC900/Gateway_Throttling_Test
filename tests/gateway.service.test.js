import { jest } from '@jest/globals';

const mockSetnx = jest.fn();
const mockHset = jest.fn();
const mockSendToQueue = jest.fn();

jest.unstable_mockModule('../src/config/redis.js', () => ({
  default: {
    setnx: mockSetnx,
    hset: mockHset,
  }
}));

jest.unstable_mockModule('../src/config/rabbitmq.js', () => ({
  getChannel: jest.fn(() => ({
    sendToQueue: mockSendToQueue,
  }))
}));

const { enqueueMessage } = await import('../src/services/gateway.service.js');

describe('Gateway Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('rechazar un mensaje duplicado', async () => {
    mockSetnx.mockResolvedValue(0);

    const payload = { id: 'msg_123', to: '+52550000', content: 'Hola' };
    const result = await enqueueMessage(payload);

    // Verificaciones
    expect(mockSetnx).toHaveBeenCalledWith('msg:msg_123:state', 'queued');
    expect(result.status).toBe('ignored');
    expect(mockSendToQueue).not.toHaveBeenCalled();
  });

  test('encolar un mensaje nuevo exitosamente', async () => {
    mockSetnx.mockResolvedValue(1);
    mockHset.mockResolvedValue(1);

    const payload = { id: 'msg_nuevo_456', to: '+52551111', content: 'Nuevo mensaje' };
    const result = await enqueueMessage(payload);

    expect(mockSetnx).toHaveBeenCalled();
    expect(mockHset).toHaveBeenCalled();
    expect(mockSendToQueue).toHaveBeenCalledWith(
      'outbound_messages',
      expect.any(Buffer),
      { persistent: true }
    );
    expect(result.status).toBe('queued');
    expect(result.id).toBe('msg_nuevo_456');
  });

  test('Validación - Debe lanzar un error si faltan campos requeridos', async () => {
    const payloadIncompleto = { id: 'msg_789' };

    await expect(enqueueMessage(payloadIncompleto)).rejects.toThrow(
      'Faltan campos requeridos: id, to, content'
    );
    
    expect(mockSetnx).not.toHaveBeenCalled();
    expect(mockSendToQueue).not.toHaveBeenCalled();
  });
});