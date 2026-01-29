import mammoth from 'mammoth';
import ExcelJS from 'exceljs';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { createReadStream } from 'fs';
import { readFile } from 'fs/promises';
import OpenAI from 'openai';

export interface ProcessedDocument {
  content: string;
  metadata: {
    pageCount?: number;
    wordCount?: number;
    extractedFrom?: string;
    audioDuration?: number;
    transcriptionConfidence?: number;
    transcriptionModel?: string;
    imageAnalysis?: {
      hasText: boolean;
      hasGraphs: boolean;
      hasInfographics: boolean;
      extractedText?: string;
      insights?: string;
    };
  };
}

export async function processDocument(
  filePath: string,
  fileType: string,
  isUrl: boolean = false
): Promise<ProcessedDocument> {
  try {
    if (isUrl) {
      return await processUrl(filePath);
    }

    switch (fileType.toLowerCase()) {
      case 'pdf':
        return await processPdf(filePath);
      case 'doc':
      case 'docx':
        return await processDoc(filePath);
      case 'txt':
        return await processTxt(filePath);
      case 'xls':
      case 'xlsx':
        return await processExcel(filePath);
      case 'csv':
        return await processCsv(filePath);
      case 'ppt':
      case 'pptx':
        return await processPowerPoint(filePath);
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
      case 'bmp':
        return await processImage(filePath);
      case 'mp3':
      case 'wav':
      case 'm4a':
      case 'ogg':
      case 'webm':
      case 'flac':
      case 'aac':
      case 'wma':
        return await processAudio(filePath, fileType);
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }
  } catch (error: any) {
    console.error(`Error processing ${fileType} document:`, error);
    throw new Error(`Failed to process document: ${error.message}`);
  }
}

async function processPdf(filePath: string): Promise<ProcessedDocument> {
  // Import PDFParse class from pdf-parse v2
  const { PDFParse } = await import('pdf-parse');
  
  // Read file into buffer
  const buffer = await readFile(filePath);
  
  // Create parser with buffer and get text
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  
  // Clean up the parser
  await parser.destroy();
  
  return {
    content: result.text,
    metadata: {
      pageCount: result.pages?.length || 0,
      wordCount: result.text.split(/\s+/).length,
      extractedFrom: 'pdf'
    }
  };
}

async function processDoc(filePath: string): Promise<ProcessedDocument> {
  const result = await mammoth.extractRawText({ path: filePath });
  
  return {
    content: result.value,
    metadata: {
      wordCount: result.value.split(/\s+/).length,
      extractedFrom: 'docx'
    }
  };
}

async function processTxt(filePath: string): Promise<ProcessedDocument> {
  const content = await readFile(filePath, 'utf-8');
  
  return {
    content,
    metadata: {
      wordCount: content.split(/\s+/).length,
      extractedFrom: 'txt'
    }
  };
}

function getCellValue(cell: ExcelJS.Cell): string {
  if (cell.value === null || cell.value === undefined) return '';
  
  const value = cell.value;
  
  if (typeof value === 'object') {
    if ('result' in value && value.result !== undefined) {
      return String(value.result);
    }
    if ('richText' in value && Array.isArray(value.richText)) {
      return value.richText.map((rt: { text?: string }) => rt.text || '').join('');
    }
    if ('text' in value && typeof value.text === 'string') {
      return value.text;
    }
    if ('hyperlink' in value && 'text' in value) {
      return String(value.text || '');
    }
    if (value instanceof Date) {
      return value.toISOString();
    }
    if ('error' in value) {
      return '#ERROR';
    }
    return '';
  }
  
  return String(value);
}

function escapeCsvValue(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

async function processExcel(filePath: string): Promise<ProcessedDocument> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  let content = '';
  
  workbook.eachSheet((worksheet) => {
    const csvRows: string[] = [];
    worksheet.eachRow((row) => {
      const rowData: string[] = [];
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        while (rowData.length < colNumber - 1) {
          rowData.push('');
        }
        const cellValue = getCellValue(cell);
        rowData.push(escapeCsvValue(cellValue));
      });
      csvRows.push(rowData.join(','));
    });
    content += `\n\n--- Sheet: ${worksheet.name} ---\n${csvRows.join('\n')}`;
  });
  
  return {
    content: content.trim(),
    metadata: {
      wordCount: content.split(/\s+/).length,
      extractedFrom: 'excel'
    }
  };
}

async function processCsv(filePath: string): Promise<ProcessedDocument> {
  const content = await readFile(filePath, 'utf-8');
  
  return {
    content,
    metadata: {
      wordCount: content.split(/\s+/).length,
      extractedFrom: 'csv'
    }
  };
}

async function processPowerPoint(filePath: string): Promise<ProcessedDocument> {
  const content = `PowerPoint files (${filePath}) are not fully supported yet. Please convert to PDF for better text extraction.`;
  
  return {
    content,
    metadata: {
      extractedFrom: 'pptx'
    }
  };
}

async function processUrl(url: string): Promise<ProcessedDocument> {
  try {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RevWinner/1.0)'
      }
    });
    
    const $ = cheerio.load(response.data);
    
    $('script, style, nav, header, footer, iframe').remove();
    
    const title = $('title').text() || '';
    const metaDescription = $('meta[name="description"]').attr('content') || '';
    const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
    
    const content = [
      title ? `Title: ${title}` : '',
      metaDescription ? `Description: ${metaDescription}` : '',
      '',
      bodyText
    ].filter(Boolean).join('\n');
    
    return {
      content,
      metadata: {
        wordCount: content.split(/\s+/).length,
        extractedFrom: 'url'
      }
    };
  } catch (error: any) {
    throw new Error(`Failed to fetch URL: ${error.message}`);
  }
}

async function processImage(filePath: string): Promise<ProcessedDocument> {
  const VISION_TIMEOUT = 30000; // 30 second timeout for vision API
  
  try {
    // Read image and convert to base64
    const imageBuffer = await readFile(filePath);
    const base64Image = imageBuffer.toString('base64');
    
    // Determine MIME type from file extension - handle all common cases
    const ext = filePath.split('.').pop()?.toLowerCase() || 'png';
    const mimeTypeMap: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'bmp': 'image/bmp'
    };
    const mimeType = mimeTypeMap[ext] || 'image/png';
    
    // Use OpenAI's GPT-4 Vision to analyze the image
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Image analysis timed out after 30 seconds')), VISION_TIMEOUT)
    );
    
    const analysisPromise = openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this image comprehensively for use in a sales knowledge base. Extract and describe:

1. **Text Content**: Extract ALL visible text (titles, labels, captions, body text, numbers)
2. **Data & Charts**: If graphs/charts exist, describe the data they show (trends, values, comparisons)
3. **Infographic Elements**: Describe any diagrams, flowcharts, icons with meanings, or visual hierarchies
4. **Key Insights**: What are the main takeaways or information someone should learn from this image?
5. **Context**: What is this image about? (product info, statistics, comparison, process flow, etc.)

Format your response as structured knowledge that can be used to answer sales questions.
Be specific with numbers, percentages, and facts visible in the image.`
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
                detail: 'high'
              }
            }
          ]
        }
      ]
    });
    
    const response = await Promise.race([analysisPromise, timeoutPromise]);
    
    // Handle Vision API response - GPT-4o-mini returns string content
    const messageContent = response.choices[0]?.message?.content;
    let analysisContent = '';
    
    if (messageContent) {
      if (typeof messageContent === 'string') {
        analysisContent = messageContent;
      } else {
        // Handle any other format by converting to string
        analysisContent = String(messageContent);
      }
    }
    
    if (!analysisContent || analysisContent.trim().length === 0) {
      throw new Error('No content extracted from image analysis');
    }
    
    // Determine what type of content was found
    const hasText = analysisContent.toLowerCase().includes('text') || 
                    analysisContent.includes('title') || 
                    analysisContent.includes('label');
    const hasGraphs = analysisContent.toLowerCase().includes('chart') || 
                      analysisContent.toLowerCase().includes('graph') ||
                      analysisContent.toLowerCase().includes('data');
    const hasInfographics = analysisContent.toLowerCase().includes('infographic') || 
                            analysisContent.toLowerCase().includes('diagram') ||
                            analysisContent.toLowerCase().includes('flowchart');
    
    // Format the extracted content for storage
    const content = `[IMAGE ANALYSIS]\n\n${analysisContent}`;
    
    console.log(`✅ Image processed successfully: ${filePath.substring(filePath.lastIndexOf('/') + 1)}`);
    
    return {
      content,
      metadata: {
        wordCount: content.split(/\s+/).length,
        extractedFrom: 'image-vision',
        imageAnalysis: {
          hasText,
          hasGraphs,
          hasInfographics,
          extractedText: analysisContent,
          insights: analysisContent.substring(0, 500)
        }
      }
    };
  } catch (error: any) {
    console.error(`❌ Image processing error:`, error.message);
    
    // Return a fallback response if vision API fails
    return {
      content: `[IMAGE] Unable to fully analyze image content. The image file has been stored but text extraction was limited. Error: ${error.message}`,
      metadata: {
        extractedFrom: 'image-fallback',
        imageAnalysis: {
          hasText: false,
          hasGraphs: false,
          hasInfographics: false
        }
      }
    };
  }
}

async function processAudio(filePath: string, fileType: string): Promise<ProcessedDocument> {
  try {
    const { transcribeAudioFile } = await import('./audioTranscription');
    
    console.log(`🎵 Processing audio file: ${filePath} (${fileType})`);
    
    const result = await transcribeAudioFile(filePath, fileType);
    
    if (!result.content || result.content.trim().length === 0) {
      throw new Error('No speech detected in audio file');
    }
    
    const content = `[AUDIO TRANSCRIPTION]\n\n${result.content}`;
    
    console.log(`✅ Audio processed successfully: ${result.duration}s, ${result.content.length} chars`);
    
    return {
      content,
      metadata: {
        wordCount: content.split(/\s+/).length,
        extractedFrom: 'audio-transcription',
        audioDuration: result.duration,
        transcriptionConfidence: result.confidence,
        transcriptionModel: result.metadata.model,
      }
    };
  } catch (error: any) {
    console.error(`❌ Audio processing error:`, error.message);
    throw new Error(`Failed to transcribe audio: ${error.message}`);
  }
}
