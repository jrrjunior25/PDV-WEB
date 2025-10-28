// services/pixService.ts

interface PixPayload {
  pixKey: string;
  recipientName: string;
  city: string;
  amount?: number;
  txid?: string;
}

/**
 * Formata um campo do BR Code com ID, tamanho e valor.
 * @param id - O ID do campo (ex: '00')
 * @param value - O valor do campo
 * @returns A string formatada (ex: '0002BR')
 */
const formatField = (id: string, value: string): string => {
  const length = value.length.toString().padStart(2, '0');
  return `${id}${length}${value}`;
};

/**
 * Gera o payload formatado para um QR Code PIX (BR Code).
 * @param payload - Os dados para a transação PIX.
 * @returns A string do BR Code pronta para ser usada no QR Code.
 */
export const generatePixBrCode = (payload: PixPayload): string => {
  const { pixKey, recipientName, city, amount, txid } = payload;

  // Campos obrigatórios
  let brCode = formatField('00', '01'); // Payload Format Indicator
  brCode += formatField('01', '12'); // Point of Initiation Method (12 = transação única)

  // Merchant Account Information (ID 26 a 51)
  let merchantAccountInfo = formatField('00', 'br.gov.bcb.pix'); // GUI
  merchantAccountInfo += formatField('01', pixKey); // Chave PIX
  // Opcional: Descrição da transação (não usado aqui para simplicidade)
  
  brCode += formatField('26', merchantAccountInfo);

  // Merchant Category Code (obrigatório)
  brCode += formatField('52', '0000'); // '0000' para não especificado

  // Transaction Currency (obrigatório)
  brCode += formatField('53', '986'); // 986 = BRL (Real Brasileiro)

  // Transaction Amount (opcional, mas recomendado)
  if (amount) {
    brCode += formatField('54', amount.toFixed(2));
  }
  
  // Country Code (obrigatório)
  brCode += formatField('58', 'BR');

  // Merchant Name (obrigatório)
  const formattedName = recipientName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .substring(0, 25) // Limita a 25 caracteres
    .toUpperCase();
  brCode += formatField('59', formattedName);

  // Merchant City (obrigatório)
  const formattedCity = city
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .substring(0, 15) // Limita a 15 caracteres
    .toUpperCase();
  brCode += formatField('60', formattedCity);

  // Additional Data Field Template (ID 62)
  const transactionId = txid || '***'; // Se não houver txid, usa '***' por padrão
  const additionalData = formatField('05', transactionId);
  brCode += formatField('62', additionalData);

  // CRC16 Checksum (obrigatório)
  brCode += '6304'; // ID e tamanho fixos
  
  const crc16 = (data: string): string => {
    let crc = 0xFFFF;
    for (let i = 0; i < data.length; i++) {
        crc ^= data.charCodeAt(i) << 8;
        for (let j = 0; j < 8; j++) {
            crc = (crc & 0x8000) ? (crc << 1) ^ 0x1021 : crc << 1;
        }
    }
    return ('0000' + (crc & 0xFFFF).toString(16).toUpperCase()).slice(-4);
  };

  const checksum = crc16(brCode);

  return brCode + checksum;
};
