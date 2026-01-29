import { Check, X, Minus, AlertCircle, Zap } from "lucide-react";

interface ComparisonRow {
  feature: string;
  yourProduct: string | boolean;
  competitor1?: string | boolean;
  competitor2?: string | boolean;
}

interface BattleCardData {
  yourProduct: string;
  competitor1?: string;
  competitor2?: string;
  technicalAdvantages?: string[];
  whyChooseUs?: string;
  slides?: {
    title: string;
    comparison: ComparisonRow[];
  }[];
}

interface BattleCardProps {
  data: BattleCardData;
}

export function BattleCard({ data }: BattleCardProps) {
  const renderValue = (value: string | boolean | undefined) => {
    if (value === true) {
      return <Check className="h-5 w-5 text-green-600 dark:text-green-400 mx-auto" />;
    }
    if (value === false) {
      return <X className="h-5 w-5 text-red-600 dark:text-red-400 mx-auto" />;
    }
    if (value === undefined || value === "") {
      return <Minus className="h-5 w-5 text-slate-400 dark:text-slate-600 mx-auto" />;
    }
    return <span className="text-sm text-slate-700 dark:text-slate-300">{value}</span>;
  };

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <AlertCircle className="h-12 w-12 text-amber-500 dark:text-amber-400 mb-4" />
        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Unable to Generate Battle Card
        </h3>
        <p className="text-slate-600 dark:text-slate-400 max-w-md">
          The AI response was incomplete. Please try again or switch to a different AI provider in Settings.
        </p>
      </div>
    );
  }

  const productName = data.yourProduct || 'Your Product';
  const competitor1 = data.competitor1;
  const competitor2 = data.competitor2;
  const technicalAdvantages = data.technicalAdvantages || [];
  const whyChooseUs = data.whyChooseUs || '';
  const slides = data.slides || [];
  const comparison = slides.length > 0 && slides[0].comparison ? slides[0].comparison : [];

  return (
    <div className="flex flex-col h-full space-y-5 overflow-y-auto p-2" data-testid="slide-battle-comparison">
      {/* Technical Edge Section */}
      {technicalAdvantages.length > 0 && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg p-4 border-2 border-blue-500 dark:border-blue-600">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100">
              Technical Edge
            </h3>
          </div>
          <ul className="space-y-2">
            {technicalAdvantages.map((adv: string, idx: number) => (
              <li key={idx} className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-blue-900 dark:text-blue-100">{adv}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Feature Comparison Table */}
      {comparison.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-purple-600 dark:border-purple-400">
                <th className="text-left p-4 font-bold text-slate-900 dark:text-slate-100">
                  Feature
                </th>
                <th className="text-center p-4 font-bold bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-purple-900 dark:text-purple-100">{productName}</span>
                    <span className="text-xs text-purple-600 dark:text-purple-400 font-normal">(You)</span>
                  </div>
                </th>
                {competitor1 && (
                  <th className="text-center p-4 font-semibold text-slate-600 dark:text-slate-400">
                    {competitor1}
                  </th>
                )}
                {competitor2 && (
                  <th className="text-center p-4 font-semibold text-slate-600 dark:text-slate-400">
                    {competitor2}
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {comparison.map((row: ComparisonRow, idx: number) => (
                <tr key={idx} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="p-4 font-medium text-slate-900 dark:text-slate-100">
                    {row.feature}
                  </td>
                  <td className="p-4 text-center bg-purple-50/50 dark:bg-purple-950/20">
                    {renderValue(row.yourProduct)}
                  </td>
                  {competitor1 && (
                    <td className="p-4 text-center">
                      {renderValue(row.competitor1)}
                    </td>
                  )}
                  {competitor2 && (
                    <td className="p-4 text-center">
                      {renderValue(row.competitor2)}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Why Choose Us Summary */}
      {whyChooseUs && (
        <div className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-lg p-5 border-l-4 border-purple-600">
          <p className="text-base font-semibold text-purple-900 dark:text-purple-100 text-center leading-relaxed">
            {whyChooseUs}
          </p>
        </div>
      )}
    </div>
  );
}
