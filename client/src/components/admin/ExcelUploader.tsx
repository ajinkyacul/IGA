import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertCircle, FileSpreadsheet, Upload } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InsertQuestion } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ExcelUploaderProps {
  domains: any[];
  onSuccess?: () => void;
}

interface ColumnMapping {
  title: string | null;
  description: string | null;
  domainId: string | null;
  required: string | null;
  tags: string | null;
}

interface PreviewData {
  headers: string[];
  rows: any[];
}

export default function ExcelUploader({ domains, onSuccess }: ExcelUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    title: null,
    description: null,
    domainId: null,
    required: null,
    tags: null,
  });
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mutation for bulk importing questions
  const importQuestionsMutation = useMutation({
    mutationFn: async (questions: Partial<InsertQuestion>[]) => {
      const res = await apiRequest("POST", "/api/admin/questions/bulk", { questions });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Questions imported",
        description: "Questions have been successfully imported from Excel.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/questions'] });
      resetUploader();
      if (onSuccess) onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    parseExcel(selectedFile);
  };

  const parseExcel = (excelFile: File) => {
    setError(null);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        // Get the first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (jsonData.length < 2) {
          setError("Excel file must contain at least a header row and one data row.");
          setIsProcessing(false);
          return;
        }

        // Get headers and data rows
        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1, 6); // Preview only first 5 rows

        setPreviewData({ headers, rows });

        // Auto-map columns based on header names
        const newMapping: ColumnMapping = {
          title: null,
          description: null,
          domainId: null,
          required: null,
          tags: null,
        };

        headers.forEach((header, index) => {
          const headerLower = header.toLowerCase();
          if (headerLower.includes('title') || headerLower.includes('question')) {
            newMapping.title = header;
          } else if (headerLower.includes('desc')) {
            newMapping.description = header;
          } else if (headerLower.includes('domain')) {
            newMapping.domainId = header;
          } else if (headerLower.includes('required') || headerLower.includes('mandatory')) {
            newMapping.required = header;
          } else if (headerLower.includes('tag')) {
            newMapping.tags = header;
          }
        });

        setColumnMapping(newMapping);
        setIsProcessing(false);
      } catch (err) {
        console.error(err);
        setError("Error parsing Excel file. Please make sure it's a valid Excel format.");
        setIsProcessing(false);
      }
    };

    reader.onerror = () => {
      setError("Error reading file.");
      setIsProcessing(false);
    };

    reader.readAsArrayBuffer(excelFile);
  };

  const handleMapping = (field: keyof ColumnMapping, value: string | null) => {
    setColumnMapping(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const processAndImportQuestions = () => {
    if (!previewData || !file) return;

    setIsProcessing(true);

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });

          // Get the first sheet
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];

          // Convert to JSON with headers
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          // Map header indices
          const headers = previewData.headers;
          const titleIdx = columnMapping.title ? headers.indexOf(columnMapping.title) : -1;
          const descIdx = columnMapping.description ? headers.indexOf(columnMapping.description) : -1;
          const domainIdx = columnMapping.domainId ? headers.indexOf(columnMapping.domainId) : -1;
          const reqIdx = columnMapping.required ? headers.indexOf(columnMapping.required) : -1;
          const tagsIdx = columnMapping.tags ? headers.indexOf(columnMapping.tags) : -1;

          if (titleIdx === -1) {
            throw new Error("Title column must be mapped");
          }

          // Map domain names to IDs
          const domainMap = new Map(
            domains.map(domain => [domain.name.toLowerCase(), domain.id])
          );

          // Process rows
          const questions: Partial<InsertQuestion>[] = jsonData.map((row: any) => {
            // Handle domain mapping (from name to ID)
            let domainId = null;
            if (domainIdx !== -1) {
              const domainValue = row[columnMapping.domainId!];
              if (typeof domainValue === 'string') {
                domainId = domainMap.get(domainValue.toLowerCase());
              } else if (typeof domainValue === 'number') {
                // Check if domain exists
                domainId = domains.find(d => d.id === domainValue)?.id;
              }
            }
            // Fallback to first domain if no valid domain found
            if (!domainId && domains.length > 0) {
              domainId = domains[0].id;
            } else if (!domainId) {
              throw new Error("No valid domain found. Please create at least one domain first.");
            }

            // Parse tags if available
            let tags = null;
            if (tagsIdx !== -1) {
              const tagValue = row[columnMapping.tags!];
              if (typeof tagValue === 'string') {
                tags = tagValue.split(',').map(t => t.trim());
              }
            }

            // Parse required field
            let required = null;
            if (reqIdx !== -1) {
              const reqValue = row[columnMapping.required!];
              if (typeof reqValue === 'boolean') {
                required = reqValue;
              } else if (typeof reqValue === 'string') {
                required = reqValue.toLowerCase() === 'yes' || 
                          reqValue.toLowerCase() === 'true' || 
                          reqValue === '1';
              } else if (typeof reqValue === 'number') {
                required = reqValue === 1;
              }
            }

            return {
              title: row[columnMapping.title!] || "",
              description: descIdx !== -1 ? row[columnMapping.description!] || null : null,
              domainId: domainId,
              required: required,
              tags: tags
            };
          });

          // Filter out any invalid questions (missing title)
          const validQuestions = questions.filter(q => q.title && q.title.trim() !== '');

          if (validQuestions.length === 0) {
            throw new Error("No valid questions found after processing");
          }

          // Import questions
          importQuestionsMutation.mutate(validQuestions);
        } catch (err: any) {
          setError(err.message || "Error processing Excel data");
          setIsProcessing(false);
        }
      };

      reader.onerror = () => {
        setError("Error reading file during processing");
        setIsProcessing(false);
      };

      reader.readAsArrayBuffer(file);
    } catch (err: any) {
      setError(err.message || "Unexpected error during processing");
      setIsProcessing(false);
    }
  };

  const resetUploader = () => {
    setFile(null);
    setPreviewData(null);
    setColumnMapping({
      title: null,
      description: null,
      domainId: null,
      required: null,
      tags: null,
    });
    setError(null);
    setIsProcessing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!previewData ? (
        <div className="space-y-4">
          <Label htmlFor="excel-upload">Upload Excel File</Label>
          <div className="flex items-center gap-2">
            <Input
              ref={fileInputRef}
              id="excel-upload"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              disabled={isProcessing}
              className="flex-1"
            />
            <Button variant="outline" disabled={isProcessing} onClick={() => fileInputRef.current?.click()}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Browse
            </Button>
          </div>

          <Card className="bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Excel File Format</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              <p>Your Excel file should contain the following columns:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li><span className="font-semibold">Title</span> - The question title (required)</li>
                <li><span className="font-semibold">Description</span> - The question description</li>
                <li><span className="font-semibold">Domain</span> - The domain name or ID</li>
                <li><span className="font-semibold">Required</span> - Whether the question is required (Yes/No)</li>
                <li><span className="font-semibold">Tags</span> - Question tags (comma-separated)</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-4">
            <Button size="sm" variant="outline" onClick={resetUploader} disabled={isProcessing}>
              Upload Different File
            </Button>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Map Excel Columns</h3>
            <p className="text-sm text-slate-500">
              Match the columns in your Excel file to the required fields
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mapping-title">Question Title</Label>
                <Select 
                  value={columnMapping.title || ''} 
                  onValueChange={(val) => handleMapping('title', val === '' ? null : val)}
                >
                  <SelectTrigger id="mapping-title">
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not Mapped</SelectItem>
                    {previewData.headers.map((header) => (
                      <SelectItem key={header} value={header}>
                        {header}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mapping-description">Description</Label>
                <Select 
                  value={columnMapping.description || ''} 
                  onValueChange={(val) => handleMapping('description', val === '' ? null : val)}
                >
                  <SelectTrigger id="mapping-description">
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not Mapped</SelectItem>
                    {previewData.headers.map((header) => (
                      <SelectItem key={header} value={header}>
                        {header}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mapping-domain">Domain</Label>
                <Select 
                  value={columnMapping.domainId || ''} 
                  onValueChange={(val) => handleMapping('domainId', val === '' ? null : val)}
                >
                  <SelectTrigger id="mapping-domain">
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not Mapped</SelectItem>
                    {previewData.headers.map((header) => (
                      <SelectItem key={header} value={header}>
                        {header}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mapping-required">Required</Label>
                <Select 
                  value={columnMapping.required || ''} 
                  onValueChange={(val) => handleMapping('required', val === '' ? null : val)}
                >
                  <SelectTrigger id="mapping-required">
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not Mapped</SelectItem>
                    {previewData.headers.map((header) => (
                      <SelectItem key={header} value={header}>
                        {header}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mapping-tags">Tags</Label>
                <Select 
                  value={columnMapping.tags || ''} 
                  onValueChange={(val) => handleMapping('tags', val === '' ? null : val)}
                >
                  <SelectTrigger id="mapping-tags">
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not Mapped</SelectItem>
                    {previewData.headers.map((header) => (
                      <SelectItem key={header} value={header}>
                        {header}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Preview</h3>
            <p className="text-sm text-slate-500">
              Showing first {previewData.rows.length} rows from your Excel file
            </p>

            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableCaption>Preview of Excel data</TableCaption>
                <TableHeader>
                  <TableRow>
                    {previewData.headers.map((header, idx) => (
                      <TableHead key={idx} className={
                        columnMapping.title === header ? "bg-blue-50 dark:bg-blue-950/20" :
                        columnMapping.description === header ? "bg-green-50 dark:bg-green-950/20" :
                        columnMapping.domainId === header ? "bg-yellow-50 dark:bg-yellow-950/20" :
                        columnMapping.required === header ? "bg-purple-50 dark:bg-purple-950/20" :
                        columnMapping.tags === header ? "bg-red-50 dark:bg-red-950/20" : ""
                      }>
                        {header}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.rows.map((row, rowIdx) => (
                    <TableRow key={rowIdx}>
                      {previewData.headers.map((header, cellIdx) => (
                        <TableCell key={cellIdx} className={
                          columnMapping.title === header ? "bg-blue-50 dark:bg-blue-950/20" :
                          columnMapping.description === header ? "bg-green-50 dark:bg-green-950/20" :
                          columnMapping.domainId === header ? "bg-yellow-50 dark:bg-yellow-950/20" :
                          columnMapping.required === header ? "bg-purple-50 dark:bg-purple-950/20" :
                          columnMapping.tags === header ? "bg-red-50 dark:bg-red-950/20" : ""
                        }>
                          {row[cellIdx] !== undefined ? String(row[cellIdx]) : ""}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              onClick={processAndImportQuestions}
              disabled={isProcessing || !columnMapping.title}
              className="w-full md:w-auto bg-primary text-primary-foreground hover:bg-primary/90" //Added class for button styling
            >
              {isProcessing ? (
                <>Processing...</>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Import Questions
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}