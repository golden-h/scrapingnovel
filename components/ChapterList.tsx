import { Button } from "@/components/ui/button"
import { Loader2, AlertCircle, Save, Check } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

interface Chapter {
  id: string
  title: string
  url: string
  content?: string
  isLoading?: boolean
  error?: string
  hasContent?: boolean
  processed?: boolean
  translated?: boolean
  done?: boolean
}

interface ChapterListProps {
  chapters: Chapter[];
  selectedChapter: string | null;
  onChapterSelect: (chapterId: string) => void;
  onProcessedChange?: (chapterId: string, processed: boolean) => void;
}

export function ChapterList({ chapters, selectedChapter, onChapterSelect, onProcessedChange }: ChapterListProps) {
  const handleProcessedChange = async (chapterId: string, processed: boolean) => {
    onProcessedChange?.(chapterId, processed)
  }

  return (
    <div className="h-[600px] overflow-y-auto pr-4">
      <div className="space-y-2">
        {chapters.map((chapter) => (
          <div key={chapter.id} className="flex items-center gap-2">
            <Checkbox
              checked={chapter.processed}
              onCheckedChange={(checked) => handleProcessedChange(chapter.id, checked as boolean)}
              className="ml-1"
            />
            <Button
              variant={selectedChapter === chapter.id ? "default" : "outline"}
              className="w-full justify-start relative"
              onClick={() => onChapterSelect(chapter.id)}
              disabled={chapter.isLoading}
            >
              <div className="truncate flex items-center gap-2">
                {chapter.isLoading && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {chapter.error && (
                  <AlertCircle className="h-4 w-4 text-destructive" />
                )}
                {chapter.hasContent && (
                  <Check className="h-4 w-4 text-green-500" />
                )}
                <div className="flex-grow truncate">{chapter.title}</div>
                <div className="flex items-center gap-2 ml-2">
                  {chapter.translated && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full whitespace-nowrap">Translated</span>
                  )}
                  {chapter.done && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full whitespace-nowrap">Done</span>
                  )}
                </div>
              </div>
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
