import React, { useState, useRef, useCallback } from 'react';
import { Crop, RotateCcw, Check, X, ZoomIn, ZoomOut } from 'lucide-react';
import ReactCrop, { Crop as CropType, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface PDFCropperProps {
  pdfFile: File;
  onCropComplete: (croppedImageData: string, cropName: string) => void;
  onCancel: () => void;
}

function PDFCropper({ pdfFile, onCropComplete, onCancel }: PDFCropperProps) {
  const [crop, setCrop] = useState<CropType>({
    unit: '%',
    width: 100,
    height: 30,
    x: 0,
    y: 0,
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [pdfImageUrl, setPdfImageUrl] = useState<string>('');
  const [cropName, setCropName] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [scale, setScale] = useState(1);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Convert PDF first page to image
  React.useEffect(() => {
    const convertPDFToImage = async () => {
      try {
        setIsProcessing(true);
        
        // Create a simple PDF to image conversion using canvas
        const fileReader = new FileReader();
        fileReader.onload = async (e) => {
          const typedarray = new Uint8Array(e.target?.result as ArrayBuffer);
          
          // For now, we'll create a placeholder image since we can't use pdf.js
          // In a real implementation, you'd use pdf.js or similar library
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = 800;
          canvas.height = 1000;
          
          if (ctx) {
            // Create a white background
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Add some placeholder content
            ctx.fillStyle = 'black';
            ctx.font = '20px Arial';
            ctx.fillText('PDF Preview - Crop the letterhead area', 50, 100);
            ctx.fillText('(This is a placeholder - in production use pdf.js)', 50, 130);
            
            // Draw a sample letterhead area
            ctx.strokeStyle = '#ccc';
            ctx.strokeRect(50, 50, 700, 200);
            ctx.fillText('Sample Letterhead Area', 60, 80);
          }
          
          const imageUrl = canvas.toDataURL('image/png');
          setPdfImageUrl(imageUrl);
          setCropName(pdfFile.name.replace('.pdf', '') + '_letterhead');
        };
        
        fileReader.readAsArrayBuffer(pdfFile);
      } catch (error) {
        console.error('Error converting PDF:', error);
        alert('Error processing PDF file');
      } finally {
        setIsProcessing(false);
      }
    };

    convertPDFToImage();
  }, [pdfFile]);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop({
      unit: '%',
      width: 100,
      height: 25,
      x: 0,
      y: 0,
    });
  }, []);

  const getCroppedImg = useCallback(
    (image: HTMLImageElement, crop: PixelCrop): Promise<string> => {
      const canvas = canvasRef.current;
      if (!canvas || !crop.width || !crop.height) {
        return Promise.reject('Canvas or crop dimensions not available');
      }

      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        return Promise.reject('No 2d context');
      }

      canvas.width = crop.width;
      canvas.height = crop.height;

      ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        crop.width,
        crop.height
      );

      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          if (!blob) {
            console.error('Canvas is empty');
            return;
          }
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        }, 'image/png');
      });
    },
    []
  );

  const handleCropComplete = async () => {
    if (!imgRef.current || !completedCrop || !cropName.trim()) {
      alert('Please set crop area and enter a name');
      return;
    }

    try {
      setIsProcessing(true);
      const croppedImageData = await getCroppedImg(imgRef.current, completedCrop);
      onCropComplete(croppedImageData, cropName.trim());
    } catch (error) {
      console.error('Error cropping image:', error);
      alert('Error cropping image');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isProcessing && !pdfImageUrl) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-600">Converting PDF to image...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
          <Crop className="w-5 h-5" />
          Crop Kop Surat dari PDF
        </h3>
        <button
          onClick={onCancel}
          className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-6">
        {/* Crop Name Input */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Nama Kop Surat
          </label>
          <input
            type="text"
            value={cropName}
            onChange={(e) => setCropName(e.target.value)}
            placeholder="Masukkan nama untuk kop surat ini"
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 mb-2">Cara Menggunakan:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Drag untuk memindahkan area crop</li>
            <li>• Drag sudut untuk mengubah ukuran area crop</li>
            <li>• Pilih area yang berisi kop surat (biasanya di bagian atas)</li>
            <li>• Klik "Simpan Crop" setelah selesai</li>
          </ul>
        </div>

        {/* Crop Controls */}
        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setScale(Math.max(0.5, scale - 0.1))}
              className="p-2 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-sm text-slate-600 min-w-[60px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={() => setScale(Math.min(2, scale + 0.1))}
              className="p-2 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
          
          <button
            onClick={() => {
              setCrop({
                unit: '%',
                width: 100,
                height: 25,
                x: 0,
                y: 0,
              });
            }}
            className="px-3 py-2 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors flex items-center gap-2 text-sm"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        </div>

        {/* Crop Area */}
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          {pdfImageUrl && (
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={undefined}
              minWidth={50}
              minHeight={30}
            >
              <img
                ref={imgRef}
                alt="PDF Preview"
                src={pdfImageUrl}
                style={{ 
                  transform: `scale(${scale})`,
                  transformOrigin: 'top left',
                  maxWidth: '100%',
                  height: 'auto'
                }}
                onLoad={onImageLoad}
              />
            </ReactCrop>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-6 py-3 bg-slate-500 text-white rounded-lg hover:bg-slate-600 transition-colors flex items-center gap-2"
          >
            <X className="w-5 h-5" />
            Batal
          </button>
          <button
            onClick={handleCropComplete}
            disabled={!completedCrop || !cropName.trim() || isProcessing}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Check className="w-5 h-5" />
            {isProcessing ? 'Memproses...' : 'Simpan Crop'}
          </button>
        </div>
      </div>

      {/* Hidden canvas for cropping */}
      <canvas
        ref={canvasRef}
        style={{ display: 'none' }}
      />
    </div>
  );
}

export default PDFCropper;