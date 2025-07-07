// utils/pdfExport.js
import html2pdf from 'html2pdf.js';

/**
 * PDF导出工具类
 */
export class PdfExporter {
    /**
     * 导出预约详情PDF
     * @param {Object} options 导出配置
     */
    static async exportBookingDetails(options = {}) {
        const {
            element,
            filename = '预约详情.pdf',
            title = '预约详情'
        } = options;

        // PDF配置
        const opt = {
            margin: [0.5, 0.5, 0.5, 0.5], // 页边距（英寸）
            filename: filename,
            image: {
                type: 'jpeg',
                quality: 0.92
            },
            html2canvas: {
                scale: 2, // 提高清晰度
                useCORS: true,
                letterRendering: true,
                allowTaint: false,
                backgroundColor: '#ffffff',
                logging: false,
                width: 794, // A4宽度（像素）
                height: 1123, // A4高度（像素）
                scrollX: 0,
                scrollY: 0
            },
            jsPDF: {
                unit: 'in',
                format: 'a4',
                orientation: 'portrait',
                compress: true
            },
            pagebreak: {
                mode: ['avoid-all', 'css', 'legacy'],
                before: '.page-break-before',
                after: '.page-break-after'
            }
        };

        try {
            // 显示加载提示
            const loading = this.showLoading('正在生成PDF，请稍候...');

            // 生成PDF
            await html2pdf().set(opt).from(element).save();

            // 隐藏加载提示
            this.hideLoading(loading);

            return { success: true, message: 'PDF导出成功' };
        } catch (error) {
            console.error('PDF导出失败:', error);
            this.hideLoading();
            return { success: false, message: `PDF导出失败: ${error.message}` };
        }
    }

    /**
     * 显示加载提示
     */
    static showLoading(message) {
        // 创建加载遮罩
        const overlay = document.createElement('div');
        overlay.className = 'pdf-export-loading';
        overlay.innerHTML = `
      <div class="pdf-loading-content">
        <div class="pdf-loading-spinner"></div>
        <div class="pdf-loading-text">${message}</div>
      </div>
    `;
        document.body.appendChild(overlay);
        return overlay;
    }

    /**
     * 隐藏加载提示
     */
    static hideLoading(loadingElement) {
        if (loadingElement && loadingElement.parentNode) {
            loadingElement.parentNode.removeChild(loadingElement);
        }
    }

    /**
     * 预处理DOM元素用于PDF导出
     */
    static preprocessElement(element) {
        // 克隆元素避免影响原始页面
        const clonedElement = element.cloneNode(true);

        // 移除不需要的元素
        const elementsToRemove = [
            '.el-button',
            '.header-actions',
            '.action-card',
            '.pdf-exclude'
        ];

        elementsToRemove.forEach(selector => {
            const elements = clonedElement.querySelectorAll(selector);
            elements.forEach(el => el.remove());
        });

        // 调整样式
        this.adjustStylesForPDF(clonedElement);

        return clonedElement;
    }

    /**
     * 调整PDF导出样式
     */
    static adjustStylesForPDF(element) {
        // 添加PDF专用样式
        const style = document.createElement('style');
        style.textContent = `
      .pdf-export-container {
        font-family: 'Microsoft YaHei', Arial, sans-serif;
        font-size: 14px;
        line-height: 1.6;
        color: #333;
        background: #fff;
        padding: 20px;
      }
      
      .pdf-export-container .el-card {
        border: 1px solid #ddd;
        border-radius: 4px;
        margin-bottom: 20px;
        box-shadow: none;
      }
      
      .pdf-export-container .el-card__header {
        background: #f8f9fa;
        border-bottom: 1px solid #ddd;
        padding: 12px 16px;
        font-weight: 600;
      }
      
      .pdf-export-container .el-card__body {
        padding: 16px;
      }
      
      .pdf-export-container .el-descriptions {
        width: 100%;
      }
      
      .pdf-export-container .el-descriptions__table {
        width: 100%;
        border-collapse: collapse;
      }
      
      .pdf-export-container .el-descriptions__label {
        background: #f8f9fa;
        font-weight: 600;
        padding: 8px 12px;
        border: 1px solid #ddd;
        width: 120px;
      }
      
      .pdf-export-container .el-descriptions__content {
        padding: 8px 12px;
        border: 1px solid #ddd;
      }
      
      .pdf-export-container .el-tag {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 3px;
        font-size: 12px;
      }
      
      .pdf-export-container .page-break-after {
        page-break-after: always;
      }
    `;

        element.appendChild(style);
        element.className += ' pdf-export-container';
    }
}