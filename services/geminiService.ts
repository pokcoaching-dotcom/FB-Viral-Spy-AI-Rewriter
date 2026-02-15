
import { GoogleGenAI, Type } from "@google/genai";

// Hàm tiện ích để làm sạch chuỗi JSON từ phản hồi của AI (loại bỏ ```json và ```)
const cleanJsonString = (text: string): string => {
  if (!text) return "{}";
  return text.replace(/^```json\s*/, "").replace(/^```\s*/, "").replace(/\s*```$/, "");
};

export const rewritePost = async (originalContent: string, tone: string = "viral", customPersona: string = "", keywords: string = "") => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  let systemInstruction = `Bạn là một chuyên gia Content Marketing hàng đầu tại Việt Nam.`;
  if (customPersona.trim()) {
    systemInstruction += ` Hãy đóng vai: "${customPersona}".`;
  }
  
  // Xử lý tone cụ thể hơn trong system instruction
  const toneInstructions: Record<string, string> = {
    viral: "Viết ngắn gọn, gây sốc, bắt trend, dùng nhiều icon.",
    professional: "Viết trang trọng, đáng tin cậy, tập trung vào số liệu và chuyên môn.",
    funny: "Viết hài hước, mặn mòi, dùng tiếng lóng Gen Z (nếu hợp), gây cười.",
    storytelling: "Viết dạng kể chuyện (Storytelling), tâm tình, dẫn dắt cảm xúc.",
    urgent: "Tạo cảm giác khẩn cấp (FOMO), thôi thúc hành động ngay lập tức.",
    emotional: "Viết sâu sắc, chạm đến nỗi đau hoặc niềm vui thầm kín, đồng cảm.",
    controversial: "Đưa ra quan điểm trái chiều, kích thích tranh luận (nhưng không vi phạm tiêu chuẩn cộng đồng)."
  };

  systemInstruction += ` Phong cách chủ đạo: ${toneInstructions[tone] || tone}.`;

  const prompt = `
    Nhiệm vụ: Viết lại nội dung bài viết Facebook dưới đây để tối ưu hóa chỉ số Viral (Tương tác).
    
    Yêu cầu:
    1. Giữ nguyên ý chính nhưng thay đổi cách diễn đạt cho hấp dẫn hơn.
    2. Sử dụng kỹ thuật "Hook" ở câu đầu tiên để thu hút sự chú ý.
    3. Thêm Call-to-Action (CTA) khéo léo ở cuối.
    4. Sử dụng icon/emoji hợp lý.
    5. Định dạng văn bản dễ đọc (xuống dòng, bullet point).
    ${keywords ? `6. QUAN TRỌNG: Lồng ghép khéo léo các từ khóa sau vào bài viết: "${keywords}".` : ""}

    Nội dung gốc:
    "${originalContent}"
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.85,
        topK: 40,
        topP: 0.95,
      }
    });
    return response.text || "";
  } catch (error) {
    console.error("AI Error:", error);
    return "Lỗi khi gọi AI. Vui lòng kiểm tra API Key hoặc kết nối.";
  }
};

export const analyzeViralFactor = async (postContent: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `
    Phân tích bài viết Facebook sau đây dưới góc độ chuyên gia.
    
    Bài viết: "${postContent}"
    
    Hãy trả về JSON gồm:
    - viralScore (0-10): Điểm khả năng viral (số thực).
    - hookScore (0-10): Điểm câu mở đầu (số thực).
    - emotion (string): Cảm xúc chủ đạo (ngắn gọn).
    - strengths (array string): 3 điểm mạnh nhất.
    - weakness (string): 1 điểm yếu lớn nhất.
    - improvement (string): Lời khuyên cụ thể để cải thiện.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            viralScore: { type: Type.NUMBER },
            hookScore: { type: Type.NUMBER },
            emotion: { type: Type.STRING },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            weakness: { type: Type.STRING },
            improvement: { type: Type.STRING }
          },
          required: ["viralScore", "hookScore", "emotion", "strengths", "weakness", "improvement"]
        }
      }
    });
    
    const text = cleanJsonString(response.text || "{}");
    return JSON.parse(text);
  } catch (error) {
    console.error("Analysis Error:", error);
    return null;
  }
};

export const generateViralIdeas = async (niche: string, keywords: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `
    Bạn là một chuyên gia Content Viral trên Facebook. 
    Dựa trên ngành nghề: "${niche}" và từ khóa: "${keywords}".
    Hãy tạo ra 5 ý tưởng bài viết Facebook có khả năng viral cao nhất.
    Trả về kết quả dưới dạng JSON ARRAY.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              content: { type: Type.STRING },
              viralReason: { type: Type.STRING },
              category: { type: Type.STRING }
            },
            required: ["title", "content", "viralReason", "category"]
          }
        }
      }
    });
    
    const text = cleanJsonString(response.text || "[]");
    return JSON.parse(text);
  } catch (error) {
    console.error("Idea Gen Error:", error);
    return [];
  }
};
