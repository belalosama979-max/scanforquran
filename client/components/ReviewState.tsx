import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, AlertTriangle, Edit2 } from "lucide-react";

interface ReviewStateProps {
  extractedData: string[][];
  columns: string[];
  onConfirm: (data: string[][]) => void;
  onCancel: () => void;
}

export const ReviewState = ({ extractedData, columns, onConfirm, onCancel }: ReviewStateProps) => {
  const [editedData, setEditedData] = useState<string[][]>(extractedData);
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);

  const isUnclearCell = (value: string) => {
    return value.includes("[غير واضح]") || value.endsWith("?");
  };

  const handleCellEdit = (rowIndex: number, colIndex: number, newValue: string) => {
    const newData = [...editedData];
    newData[rowIndex] = [...newData[rowIndex]];
    newData[rowIndex][colIndex] = newValue;
    setEditedData(newData);
  };

  const handleConfirm = () => {
    // Clean up the data - remove ? marks and replace [غير واضح] with empty
    const cleanedData = editedData.map(row => 
      row.map(cell => {
        if (cell === "[غير واضح]") return "";
        if (cell.endsWith("?")) return cell.slice(0, -1);
        return cell;
      })
    );
    onConfirm(cleanedData);
  };

  const unclearCount = editedData.reduce((count, row) => 
    count + row.filter(cell => isUnclearCell(cell)).length, 0
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-amber-600" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">
          مراجعة البيانات المستخرجة
        </h2>
        <p className="text-muted-foreground">
          {unclearCount > 0 
            ? `يوجد ${unclearCount} خلية تحتاج مراجعتك (مميزة بالأصفر)`
            : "جميع البيانات واضحة، يمكنك التأكيد"
          }
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-muted">
              {columns.map((col, index) => (
                <th key={index} className="border border-border px-3 py-2 text-right font-semibold">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {editedData.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-muted/50">
                {row.map((cell, colIndex) => {
                  const isUnclear = isUnclearCell(cell);
                  const isEditing = editingCell?.row === rowIndex && editingCell?.col === colIndex;
                  
                  return (
                    <td 
                      key={colIndex} 
                      className={`border border-border px-3 py-2 ${
                        isUnclear ? 'bg-amber-50' : ''
                      }`}
                    >
                      {isEditing ? (
                        <Input
                          value={cell}
                          onChange={(e) => handleCellEdit(rowIndex, colIndex, e.target.value)}
                          onBlur={() => setEditingCell(null)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') setEditingCell(null);
                          }}
                          autoFocus
                          className="h-8 text-sm"
                          dir="rtl"
                        />
                      ) : (
                        <div 
                          className="flex items-center gap-2 cursor-pointer group"
                          onClick={() => setEditingCell({ row: rowIndex, col: colIndex })}
                        >
                          <span className={isUnclear ? 'text-amber-700' : ''}>
                            {cell || <span className="text-muted-foreground italic">فارغ</span>}
                          </span>
                          <Edit2 className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-3 justify-center">
        <Button variant="outline" onClick={onCancel}>
          إلغاء
        </Button>
        <Button variant="emerald" onClick={handleConfirm}>
          <CheckCircle2 className="ml-2 h-5 w-5" />
          تأكيد وإضافة للجدول
        </Button>
      </div>
    </div>
  );
};
