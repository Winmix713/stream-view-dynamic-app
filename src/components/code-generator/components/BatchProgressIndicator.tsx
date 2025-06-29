import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Files,
  TrendingUp,
  Activity
} from 'lucide-react';
import { BatchProcessingState } from '@/contexts/FigmaStepsContext';

interface BatchProgressIndicatorProps {
  batchState: BatchProcessingState;
  className?: string;
}

export const BatchProgressIndicator: React.FC<BatchProgressIndicatorProps> = ({ 
  batchState, 
  className = '' 
}) => {
  const { 
    files, 
    totalProgress, 
    successCount, 
    errorCount, 
    currentFileIndex,
    isActive,
    startTime,
    endTime 
  } = batchState;

  const totalFiles = files.length;
  const completedFiles = successCount + errorCount;
  const remainingFiles = totalFiles - completedFiles;
  const currentFile = files[currentFileIndex];

  // Calculate timing metrics
  const elapsedTime = startTime ? (endTime || Date.now()) - startTime : 0;
  const averageTimePerFile = completedFiles > 0 ? elapsedTime / completedFiles : 0;
  const estimatedTimeRemaining = remainingFiles > 0 && averageTimePerFile > 0 
    ? Math.round(averageTimePerFile * remainingFiles) 
    : 0;

  // Calculate success rate
  const successRate = completedFiles > 0 ? Math.round((successCount / completedFiles) * 100) : 0;

  // Format time
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  if (totalFiles === 0) return null;

  return (
    <Card className={`bg-gray-800 border-gray-700 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-white text-lg">
          <Activity className="w-5 h-5 text-blue-400" />
          Batch Processing Status
          {isActive && (
            <Badge variant="outline" className="bg-blue-900/20 border-blue-600 text-blue-400">
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              Active
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-300">Overall Progress</span>
            <span className="text-gray-400">{completedFiles}/{totalFiles} files</span>
          </div>
          <Progress value={totalProgress} className="h-2" />
          <div className="text-xs text-gray-500 text-center">{totalProgress}% Complete</div>
        </div>

        {/* Current File */}
        {isActive && currentFile && (
          <div className="p-3 bg-blue-900/20 border border-blue-600 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
              <span className="text-blue-400 font-medium text-sm">Currently Processing</span>
            </div>
            <div className="text-white text-sm font-medium">{currentFile.name}</div>
            <div className="text-xs text-gray-400 truncate">{currentFile.url}</div>
            {currentFile.progress > 0 && (
              <Progress value={currentFile.progress} className="h-1 mt-2" />
            )}
          </div>
        )}

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-gray-700 rounded-lg text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-xs text-gray-400">Success</span>
            </div>
            <div className="text-lg font-bold text-green-400">{successCount}</div>
            {completedFiles > 0 && (
              <div className="text-xs text-gray-500">{successRate}% rate</div>
            )}
          </div>
          
          <div className="p-3 bg-gray-700 rounded-lg text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-xs text-gray-400">Errors</span>
            </div>
            <div className="text-lg font-bold text-red-400">{errorCount}</div>
            {completedFiles > 0 && (
              <div className="text-xs text-gray-500">{100 - successRate}% rate</div>
            )}
          </div>
        </div>

        {/* Timing Information */}
        {(isActive || elapsedTime > 0) && (
          <div className="grid grid-cols-2 gap-3">
            <div className="p-2 bg-gray-700 rounded text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Clock className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-400">Elapsed</span>
              </div>
              <div className="text-sm font-medium text-white">
                {formatTime(elapsedTime)}
              </div>
            </div>
            
            {isActive && estimatedTimeRemaining > 0 && (
              <div className="p-2 bg-gray-700 rounded text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <TrendingUp className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-400">Remaining</span>
                </div>
                <div className="text-sm font-medium text-white">
                  {formatTime(estimatedTimeRemaining)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Performance Metrics */}
        {completedFiles > 0 && (
          <div className="p-2 bg-gray-700 rounded">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Avg. Time per File:</span>
              <span className="text-white font-medium">
                {formatTime(averageTimePerFile)}
              </span>
            </div>
          </div>
        )}

        {/* File Queue Preview */}
        {remainingFiles > 0 && !isActive && (
          <div className="p-2 bg-gray-700 rounded">
            <div className="flex items-center gap-2 mb-2">
              <Files className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-400">
                {remainingFiles} files in queue
              </span>
            </div>
            <div className="space-y-1">
              {files.slice(currentFileIndex, currentFileIndex + 3).map((file, index) => (
                <div key={file.id} className="text-xs text-gray-300 truncate">
                  {index + 1}. {file.name}
                </div>
              ))}
              {remainingFiles > 3 && (
                <div className="text-xs text-gray-500">
                  ...and {remainingFiles - 3} more files
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};