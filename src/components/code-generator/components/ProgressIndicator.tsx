
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Loader2,
  Zap,
  Target,
  TrendingUp
} from 'lucide-react';
import { useFigmaSteps } from '@/contexts/FigmaStepsContext';

/**
 * Enhanced Progress Indicator Component
 * Shows overall progress, current step status, and performance metrics
 */
export const ProgressIndicator: React.FC = () => {
  const { state } = useFigmaSteps();
  const { stepStatus, uiState } = state;

  // Calculate overall progress
  const completedSteps = Object.values(stepStatus).filter(status => status === 'success').length;
  const totalSteps = Object.keys(stepStatus).length;
  const progressPercentage = (completedSteps / totalSteps) * 100;

  // Get current active step
  const currentStep = Object.entries(stepStatus).find(([_, status]) => status === 'loading')?.[0];
  const hasErrors = Object.values(stepStatus).some(status => status === 'error');
  const allCompleted = completedSteps === totalSteps;

  // Step names mapping
  const stepNames = {
    step1: 'Figma Configuration',
    step2: 'SVG Generation',
    step3: 'CSS Implementation',
    step4: 'Final Generation'
  };

  // Get step icon
  const getStepIcon = (stepKey: string, status: string) => {
    const iconProps = { className: "w-4 h-4" };
    
    switch (status) {
      case 'loading':
        return <Loader2 {...iconProps} className="w-4 h-4 animate-spin text-blue-400" />;
      case 'success':
        return <CheckCircle {...iconProps} className="w-4 h-4 text-green-400" />;
      case 'error':
        return <AlertCircle {...iconProps} className="w-4 h-4 text-red-400" />;
      default:
        return <div className="w-4 h-4 rounded-full border-2 border-gray-600" />;
    }
  };

  return (
    <Card className="bg-gray-800 border-gray-700 mb-6">
      <CardContent className="pt-6">
        <div className="space-y-6">
          {/* Progress Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500">
                {allCompleted ? (
                  <CheckCircle className="w-6 h-6 text-white" />
                ) : hasErrors ? (
                  <AlertCircle className="w-6 h-6 text-white" />
                ) : (
                  <TrendingUp className="w-6 h-6 text-white" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-medium text-white">Generation Progress</h3>
                <p className="text-sm text-gray-400">
                  {allCompleted 
                    ? 'All steps completed successfully!' 
                    : hasErrors 
                    ? 'Some steps need attention'
                    : currentStep 
                    ? `Currently processing: ${stepNames[currentStep as keyof typeof stepNames]}`
                    : 'Ready to start generation'
                  }
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge 
                variant="outline" 
                className={`text-sm ${
                  allCompleted ? 'text-green-400 border-green-400' :
                  hasErrors ? 'text-red-400 border-red-400' :
                  'text-blue-400 border-blue-400'
                }`}
              >
                {completedSteps}/{totalSteps} Steps
              </Badge>
              
              {uiState.progress.message && (
                <Badge variant="secondary" className="text-xs">
                  <Clock className="w-3 h-3 mr-1" />
                  {uiState.progress.message}
                </Badge>
              )}
            </div>
          </div>

          {/* Main Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-300">Overall Progress</span>
              <span className="text-gray-400">{Math.round(progressPercentage)}%</span>
            </div>
            <Progress 
              value={progressPercentage} 
              className="h-3"
            />
          </div>

          {/* Step Status Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {Object.entries(stepStatus).map(([stepKey, status], index) => (
              <div
                key={stepKey}
                className={`p-4 rounded-lg border transition-all duration-300 ${
                  status === 'success' 
                    ? 'bg-green-900/20 border-green-600' 
                    : status === 'loading'
                    ? 'bg-blue-900/20 border-blue-600 animate-pulse'
                    : status === 'error'
                    ? 'bg-red-900/20 border-red-600'
                    : 'bg-gray-700 border-gray-600'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getStepIcon(stepKey, status)}
                    <span className="text-sm font-medium text-white">
                      Step {index + 1}
                    </span>
                  </div>
                  
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${
                      status === 'success' ? 'text-green-400 border-green-400' :
                      status === 'loading' ? 'text-blue-400 border-blue-400' :
                      status === 'error' ? 'text-red-400 border-red-400' :
                      'text-gray-400 border-gray-400'
                    }`}
                  >
                    {status === 'idle' ? 'Pending' : status}
                  </Badge>
                </div>
                
                <div className="text-xs text-gray-300">
                  {stepNames[stepKey as keyof typeof stepNames]}
                </div>
                
                {/* Step-specific progress */}
                {status === 'loading' && (
                  <div className="mt-2">
                    <Progress value={undefined} className="h-1" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Performance Metrics */}
          {completedSteps > 0 && (
            <div className="p-4 bg-gray-700 rounded-lg border border-gray-600">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  Performance Metrics
                </h4>
                <Badge variant="outline" className="text-xs text-yellow-400">
                  Live
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="text-center">
                  <div className="text-lg font-bold text-white">{completedSteps}</div>
                  <div className="text-gray-400">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-white">
                    {hasErrors ? Object.values(stepStatus).filter(s => s === 'error').length : 0}
                  </div>
                  <div className="text-gray-400">Errors</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-white">
                    {Math.round(progressPercentage)}%
                  </div>
                  <div className="text-gray-400">Complete</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-white">
                    {allCompleted ? '100%' : 'N/A'}
                  </div>
                  <div className="text-gray-400">Quality</div>
                </div>
              </div>
            </div>
          )}

          {/* Current Step Info */}
          {currentStep && (
            <div className="text-center p-3 bg-blue-900/20 border border-blue-600 rounded-lg">
              <div className="flex items-center justify-center space-x-2 text-blue-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm font-medium">
                  Processing: {stepNames[currentStep as keyof typeof stepNames]}
                </span>
              </div>
              {uiState.progress.message && (
                <div className="text-xs text-blue-300 mt-1">
                  {uiState.progress.message}
                </div>
              )}
            </div>
          )}

          {/* Completion Message */}
          {allCompleted && (
            <div className="text-center p-4 bg-green-900/20 border border-green-600 rounded-lg">
              <div className="flex items-center justify-center space-x-2 text-green-400 mb-2">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Generation Complete!</span>
              </div>
              <div className="text-sm text-green-300">
                🎉 Your Figma design has been successfully converted to production-ready code
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
