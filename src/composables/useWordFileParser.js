import { ref } from 'vue';
import * as XLSX from 'xlsx';

/**
 * Hook này xử lý việc upload và parse file từ người dùng (JSON, CSV, hoặc Excel),
 * sau đó chuẩn hóa dữ liệu để hiển thị preview hoặc import vào hệ thống.
 */
export function useWordFileParser() {
  // Danh sách dữ liệu được đọc từ file (preview nội dung)
  const uploadPreview = ref([]);
  // Biến lưu lỗi trong quá trình upload hoặc parse
  const uploadError = ref('');

  /**
   * Chuẩn hóa phần mô tả (desc) của mỗi dòng dữ liệu.
   * Một số file có thể lưu desc ở dạng object, số khác ở dạng cột riêng (desc_en, desc_vi...).
   * => Hàm này giúp gom các trường đó lại thành một object thống nhất: { en, vi, zh-tw }
   */
  function mapDesc(row) {
    // Trường hợp desc là object
    if (row.desc && typeof row.desc === 'object') {
      return {
        en: row.desc.en || '',
        vi: row.desc.vi || '',
        'zh-tw': row.des?.tw || row.desc.tw || '' // có thể bị ghi nhầm 'des.tw'
      };
    }
    
    // Trường hợp desc nằm ở các cột riêng lẻ (desc_en, desc.vi, v.v)
    return {
      en: row.desc_en || row['desc.en'] || '',
      vi: row.desc_vi || row['desc.vi'] || '',
      'zh-tw': row.desc_tw || row['desc.tw'] || row.desc_zhtw || ''
    };
  }

  /**
   * Xử lý parse file JSON.
   * - Đọc file text
   * - Parse sang object
   * - Chuẩn hóa từng dòng với mapDesc()
   */
  async function parseJsonFile(file) {
    const text = await file.text();
    const data = JSON.parse(text);
    uploadPreview.value = (Array.isArray(data) ? data : [data]).map(row => ({
      ...row,
      desc: mapDesc(row)
    }));
  }

  /**
   * Xử lý parse file CSV thủ công (dựa trên split dòng + split dấu phẩy).
   * - Tách header dòng đầu tiên
   * - Lặp qua các dòng dữ liệu
   * - Ghép lại thành object theo header
   * - Chuẩn hóa desc cho từng dòng
   */
  async function parseCsvFile(file) {
    const text = await file.text();
    const lines = text.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());

    uploadPreview.value = lines.slice(1)
      .filter(line => line.trim()) // loại bỏ dòng trống
      .map(line => {
        const values = line.split(',').map(v => v.trim());
        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = values[index] || '';
        });
        obj.desc = mapDesc(obj);
        return obj;
      });

    console.log('CSV preview:', uploadPreview.value);
  }

  /**
   * Xử lý parse file Excel (xlsx)
   * - Đọc buffer từ file
   * - Parse workbook bằng thư viện XLSX
   * - Lấy sheet đầu tiên
   * - Convert sang JSON và chuẩn hóa desc
   */
  async function parseExcelFile(file) {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer);
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    uploadPreview.value = XLSX.utils.sheet_to_json(firstSheet).map(row => ({
      ...row,
      desc: mapDesc(row)
    }));
  }

  /**
   * Hàm trung gian xử lý khi người dùng chọn file.
   * - Kiểm tra định dạng file (JSON, CSV, Excel)
   * - Gọi parser tương ứng
   * - Nếu lỗi thì hiển thị thông báo.
   */
  async function handleFileSelect(event) {
    uploadError.value = '';
    try {
      const file = event?.target?.files?.[0];
      if (!file) {
        uploadError.value = 'No file selected or unsupported format';
        return;
      }

      // Phân loại theo đuôi file
      if (file.name.endsWith('.json')) {
        await parseJsonFile(file);
      } else if (file.name.endsWith('.csv')) {
        await parseCsvFile(file);
      } else if (file.name.endsWith('.xlsx')) {
        await parseExcelFile(file);
      } else {
        uploadError.value = 'Unsupported file format';
      }
    } catch (error) {
      console.error('File parse error:', error);
      uploadError.value = 'File parse error: ' + error.message;
    }
  }

  // Trả ra các biến và hàm để component khác có thể sử dụng
  return {
    uploadPreview, // danh sách preview sau khi parse
    uploadError,   // lỗi nếu có
    handleFileSelect, // hàm xử lý sự kiện chọn file
  };
}
