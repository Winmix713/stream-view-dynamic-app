import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  Trash2, 
  Play, 
  Pause, 
  RefreshCw,
  Files,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileText,
  Download,
  Eye
} from 'lucide-react';
import { useFigmaSteps, FigmaFileItem } from '@/contexts/FigmaStepsContext';

interface FileListItemProps {
  file: FigmaFileItem;
  onRemove: (id: string) => void;
  onView?: (file: FigmaFileItem) => void;
}

const FileListItem: React.FC<FileListItemProps> = ({ file, onRemove, onView }) => {
  const getStatusIcon = (status: FigmaFileItem['status']) => {
    switch (status) {
      case 'loading':
      case 'processing':
        return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return <FileText className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: FigmaFileItem['status']) => {
    switch (status) {
      case 'loading':
      case 'processing':
        return 'border-blue-500 bg-blue-900/20';
      case 'success':
        return 'border-green-500 bg-green-900/20';
      case 'error':
        return 'border-red-500 bg-red-900/20';
      default:
        return 'border-gray-600 bg-gray-800';
    }
  };

  return (
    <div className={`p-3 rounded-lg border transition-all duration-200 ${getStatusColor(file.status)}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {getStatusIcon(file.status)}
          <span className="text-white font-medium text-sm">{file.name}</span>
          {file.processingTime && (
            <Badge variant="outline" className="text-xs">
              <Clock className="w-3 h-3 mr-1" />
              {file.processingTime}ms
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          {file.status === 'success' && onView && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onView(file)}
              className="h-6 w-6 p-0 text-gray-400 hover:text-white"
              aria-label={`View details for ${file.name}`}
            >
              <Eye className="w-3 h-3" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(file.id)}
            className="h-6 w-6 p-0 text-gray-400 hover:text-red-400"
            aria-label={`Remove ${file.name} from queue`}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
      
      <div className="text-xs text-gray-400 mb-2 truncate" title={file.url}>
        {file.url}
      </div>
      
      {(file.status === 'loading' || file.status === 'processing') && (
        <Progress value={file.progress} className="h-1 mb-2" />
      )}
      
      {file.error && (
        <div className="text-xs text-red-400 mt-1 p-2 bg-red-900/20 rounded">
          {file.error}
        </div>
      )}
    </div>
  );
};

interface BatchProcessingSummaryProps {
  batchState: {
    files: FigmaFileItem[];
    totalProgress: number;
    successCount: number;
    errorCount: number;
    currentFileIndex: number;
    isActive: boolean;
    startTime?: number;
    endTime?: number;
  };
}

const BatchProcessingSummary: React.FC<BatchProcessingSummaryProps> = ({ batchState }) => {
  const { files, totalProgress, successCount, errorCount, currentFileIndex, isActive, startTime, endTime } = batchState;
  
  const currentFile = files[currentFileIndex];
  const totalFiles = files.length;
  const completedFiles = successCount + errorCount;
  
  const elapsedTime = startTime ? (endTime || Date.now()) - startTime : 0;
  const estimatedTimeRemaining = isActive && completedFiles > 0 
    ? Math.round((elapsedTime / completedFiles) * (totalFiles - completedFiles))
    : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-white">
          Batch Processing Progress
        </div>
        <div className="text-xs text-gray-400" aria-live="polite">
          {completedFiles} of {totalFiles} files processed
        </div>
      </div>
      
      <Progress 
        value={totalProgress} 
        className="h-2" 
        aria-label={`Processing progress: ${Math.round(totalProgress)}% complete`}
      />
      
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="p-2 bg-gray-700 rounded">
          <div className="text-lg font-bold text-green-400">{successCount}</div>
          <div className="text-xs text-gray-400">Success</div>
        </div>
        <div className="p-2 bg-gray-700 rounded">
          <div className="text-lg font-bold text-red-400">{errorCount}</div>
          <div className="text-xs text-gray-400">Errors</div>
        </div>
        <div className="p-2 bg-gray-700 rounded">
          <div className="text-lg font-bold text-blue-400">{totalFiles - completedFiles}</div>
          <div className="text-xs text-gray-400">Remaining</div>
        </div>
      </div>
      
      {isActive && currentFile && (
        <div className="p-2 bg-blue-900/20 border border-blue-600 rounded text-sm">
          <div className="text-blue-400 font-medium">Currently Processing:</div>
          <div className="text-white">{currentFile.name}</div>
          {estimatedTimeRemaining > 0 && (
            <div className="text-xs text-gray-400 mt-1">
              Estimated time remaining: {Math.round(estimatedTimeRemaining / 1000)}s
            </div>
          )}
        </div>
      )}
      
      {!isActive && elapsedTime > 0 && (
        <div className="text-xs text-gray-400 text-center">
          Total processing time: {Math.round(elapsedTime / 1000)}s
        </div>
      )}
    </div>
  );
};

export const MultiFigmaFileManager: React.FC = () => {
  const { state, actions } = useFigmaSteps();
  const { stepData } = state;
  const { batchProcessing } = stepData;
  
  const [newFileUrl, setNewFileUrl] = useState('');
  const [newFileName, setNewFileName] = useState('');

  const handleAddFile = useCallback(() => {
    if (!newFileUrl.trim()) return;
    
    // Create FigmaFileItem object with proper structure
    const fileItem: FigmaFileItem = {
      id: Date.now().toString(),
      name: newFileName || `File ${batchProcessing.files.length + 1}`,
      url: newFileUrl,
      accessToken: stepData.accessToken,
      status: 'pending',
      progress: 0
    };
    
    actions.addFigmaFile(fileItem);
    setNewFileUrl('');
    setNewFileName('');
  }, [newFileUrl, newFileName, actions, batchProcessing.files.length, stepData.accessToken]);

  const handleRemoveFile = useCallback((id: string) => {
    actions.removeFigmaFile(id);
  }, [actions]);

  const handleStartBatch = useCallback(() => {
    actions.startBatchProcessing();
  }, [actions]);

  const handleStopBatch = useCallback(() => {
    actions.stopBatchProcessing();
  }, [actions]);

  const handleResetBatch = useCallback(() => {
    actions.resetBatchProcessing();
  }, [actions]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddFile();
    }
  }, [handleAddFile]);

  const canStartBatch = batchProcessing.files.length > 0 && !batchProcessing.isActive && stepData.accessToken.trim();
  const hasCompletedFiles = batchProcessing.successCount > 0;

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Files className="w-5 h-5 text-purple-400" />
          Multi-File Processing
          <Badge variant="outline" className="text-xs">
            {batchProcessing.files.length} files
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Add New File */}
        <div className="space-y-3">
          <Label className="text-gray-300 text-sm font-medium" htmlFor="figma-file-url">
            Add Figma Files
          </Label>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                id="figma-file-url"
                value={newFileUrl}
                onChange={(e) => setNewFileUrl(e.target.value)}
                onKeyPress={handleKeyPress}
                className="bg-gray-700 border-gray-600 text-white text-sm"
                placeholder="https://www.figma.com/design/..."
                disabled={batchProcessing.isActive}
                aria-describedby="figma-file-url-help"
                aria-required="true"
              />
            </div>
            <div className="w-32">
              <Input
                id="figma-file-name"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                onKeyPress={handleKeyPress}
                className="bg-gray-700 border-gray-600 text-white text-sm"
                placeholder="File name"
                disabled={batchProcessing.isActive}
                aria-label="Optional file name"
                aria-describedby="figma-file-name-help"
              />
            </div>
            <Button
              onClick={handleAddFile}
              disabled={!newFileUrl.trim() || batchProcessing.isActive}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700"
              aria-label="Add Figma file to processing queue"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div id="figma-file-url-help" className="sr-only">
            Enter a Figma file URL to add to the batch processing queue
          </div>
          <div id="figma-file-name-help" className="sr-only">
            Optional custom name for the file in the queue
          </div>
        </div>

        {/* File List */}
        {batchProcessing.files.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-gray-300 text-sm font-medium">
                Files Queue ({batchProcessing.files.length})
              </Label>
              <div className="flex gap-2">
                {hasCompletedFiles && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetBatch}
                    disabled={batchProcessing.isActive}
                    className="text-gray-300 border-gray-600 hover:bg-gray-700"
                    aria-label="Reset batch processing and clear all completed files"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Reset
                  </Button>
                )}
                {batchProcessing.isActive ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleStopBatch}
                    className="text-red-400 border-red-600 hover:bg-red-900/20"
                    aria-label="Stop batch processing of files"
                  >
                    <Pause className="w-3 h-3 mr-1" />
                    Stop
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={handleStartBatch}
                    disabled={!canStartBatch}
                    className="bg-green-600 hover:bg-green-700"
                    aria-label={`Start batch processing of ${batchProcessing.files.length} files`}
                  >
                    <Play className="w-3 h-3 mr-1" />
                    Start Batch
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {batchProcessing.files.map((file) => (
                <FileListItem
                  key={file.id}
                  file={file}
                  onRemove={handleRemoveFile}
                />
              ))}
            </div>
          </div>
        )}

        {/* Batch Processing Summary */}
        {(batchProcessing.isActive || batchProcessing.successCount > 0 || batchProcessing.errorCount > 0) && (
          <>
            <Separator className="bg-gray-600" />
            <BatchProcessingSummary batchState={batchProcessing} />
          </>
        )}

        {/* Access Token Warning */}
        {batchProcessing.files.length > 0 && !stepData.accessToken.trim() && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Please provide a Figma Personal Access Token in Step 1 to enable batch processing.
            </AlertDescription>
          </Alert>
        )}

        {/* Success Actions */}
        {hasCompletedFiles && !batchProcessing.isActive && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-gray-300 border-gray-600 hover:bg-gray-700"
              aria-label={`Download all ${batchProcessing.successCount} successfully processed files`}
            >
              <Download className="w-3 h-3 mr-1" />
              Download All
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-gray-300 border-gray-600 hover:bg-gray-700"
              aria-label="Generate processing report with success and error details"
            >
              <FileText className="w-3 h-3 mr-1" />
              Generate Report
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
