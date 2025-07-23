export interface OCRResult {
  text: string;
  confidence: number;
  pages: Array<{
    pageNumber: number;
    text: string;
    confidence: number;
  }>;
}

export class OCRService {
  // Simulate OCR processing - in production would use Tesseract.js or cloud OCR
  async processDocument(fileBuffer: Buffer, fileName: string): Promise<OCRResult> {
    try {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock OCR result based on file type
      const isImage = /\.(jpg|jpeg|png|gif|bmp)$/i.test(fileName);
      const isPDF = /\.pdf$/i.test(fileName);
      
      if (!isImage && !isPDF) {
        throw new Error("Unsupported file format. Please upload PDF or image files.");
      }

      // Simulate realistic OCR output for educational content
      const mockText = this.generateMockExamContent(fileName);
      
      return {
        text: mockText,
        confidence: 0.95,
        pages: [
          {
            pageNumber: 1,
            text: mockText,
            confidence: 0.95,
          }
        ]
      };
    } catch (error) {
      console.error("OCR processing failed:", error);
      throw new Error("Failed to process document with OCR");
    }
  }

  private generateMockExamContent(fileName: string): string {
    // Generate realistic exam paper content for demonstration
    const subject = this.extractSubjectFromFileName(fileName);
    
    const templates = {
      'Computer Science': `
        NATIONAL EXAMINATIONS BOARD
        Computer Science - Advanced Level
        Duration: 3 Hours

        SECTION A: Answer ALL questions (40 marks)

        1. (a) Define database normalization and explain its importance in database design. (5 marks)
           (b) Describe the differences between First Normal Form (1NF), Second Normal Form (2NF), and Third Normal Form (3NF). Provide examples to illustrate each form. (10 marks)

        2. (a) What is an algorithm? Explain the characteristics of a good algorithm. (6 marks)
           (b) Write a pseudocode algorithm to find the largest element in an array of integers. (8 marks)
           (c) Analyze the time complexity of your algorithm. (6 marks)

        3. (a) Explain the concept of object-oriented programming. (5 marks)
           (b) Define and differentiate between the following OOP concepts:
               i) Encapsulation
               ii) Inheritance  
               iii) Polymorphism (10 marks)

        SECTION B: Answer TWO questions from this section (40 marks)

        4. (a) Describe the software development life cycle (SDLC). (8 marks)
           (b) Compare and contrast the Waterfall and Agile development methodologies. (12 marks)

        5. (a) What is a computer network? Explain the advantages of computer networks. (8 marks)
           (b) Describe the OSI reference model, explaining the function of each layer. (12 marks)
      `,
      'Mathematics': `
        NATIONAL EXAMINATIONS BOARD
        Mathematics - Advanced Level
        Duration: 3 Hours

        SECTION A: Answer ALL questions

        1. Given that f(x) = 2x² + 3x - 1, find:
           (a) f'(x) (3 marks)
           (b) f''(x) (2 marks)
           (c) The critical points of f(x) (5 marks)

        2. Solve the following system of equations:
           2x + 3y = 7
           4x - y = 1 (8 marks)

        3. Find the integral of ∫(3x² + 2x + 1)dx (6 marks)
      `,
      'default': `
        NATIONAL EXAMINATIONS BOARD
        ${subject} - Advanced Level
        Duration: 3 Hours

        1. Define the key concepts in ${subject} and explain their practical applications. (10 marks)

        2. Analyze the relationship between different theories in ${subject}. (15 marks)

        3. Provide examples that demonstrate your understanding of ${subject} principles. (10 marks)
      `
    };

    return templates[subject as keyof typeof templates] || templates.default;
  }

  private extractSubjectFromFileName(fileName: string): string {
    const name = fileName.toLowerCase();
    
    if (name.includes('computer') || name.includes('cs') || name.includes('programming')) {
      return 'Computer Science';
    } else if (name.includes('math') || name.includes('algebra') || name.includes('calculus')) {
      return 'Mathematics';
    } else if (name.includes('physics')) {
      return 'Physics';
    } else if (name.includes('chemistry')) {
      return 'Chemistry';
    } else if (name.includes('biology')) {
      return 'Biology';
    }
    
    return 'General Studies';
  }

  async validateDocument(fileBuffer: Buffer, fileName: string): Promise<boolean> {
    // Validate file size (max 10MB)
    if (fileBuffer.length > 10 * 1024 * 1024) {
      throw new Error("File size too large. Maximum size is 10MB.");
    }

    // Validate file type
    const validExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.bmp'];
    const hasValidExtension = validExtensions.some(ext => 
      fileName.toLowerCase().endsWith(ext)
    );

    if (!hasValidExtension) {
      throw new Error("Invalid file type. Please upload PDF or image files only.");
    }

    return true;
  }
}

export const ocrService = new OCRService();
