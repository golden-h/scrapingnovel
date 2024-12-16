import { Button } from "@/components/ui/button"
import { Filter } from "lucide-react"
import { useState } from "react"

interface Chapter {
  id: string
  title: string
  url: string
  content?: string
  isLoading?: boolean
  error?: string
  translated?: boolean
  done?: boolean
}

interface ChapterListProps {
  chapters: Chapter[];
  selectedChapter: string | null;
  onChapterSelect: (chapterId: string) => void;
}

export function ChapterList({ chapters, selectedChapter, onChapterSelect }: ChapterListProps) {
  const [showTranslated, setShowTranslated] = useState<boolean | null>(false);
  const [showDone, setShowDone] = useState<boolean | null>(null);

  const filteredChapters = chapters.filter(chapter => {
    if (showTranslated === true && !chapter.translated) return false;
    if (showTranslated === false && chapter.translated) return false;
    if (showDone === true && chapter.done !== true) return false;
    if (showDone === false && chapter.done === true) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 pb-2">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <span className="text-sm font-medium">Filters:</span>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          className={showTranslated === true ? "bg-blue-100" : ""}
          onClick={() => setShowTranslated(prev => prev === true ? null : true)}
        >
          Translated
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          className={showTranslated === false ? "bg-blue-100" : ""}
          onClick={() => setShowTranslated(prev => prev === false ? null : false)}
        >
          Not Translated
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          className={showDone === true ? "bg-green-100" : ""}
          onClick={() => setShowDone(prev => prev === true ? null : true)}
        >
          Done
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          className={showDone === false ? "bg-green-100" : ""}
          onClick={() => setShowDone(prev => prev === false ? null : false)}
        >
          Not Done
        </Button>
      </div>
      <div className="h-[600px] overflow-y-auto pr-4">
        <div className="space-y-2">
          {filteredChapters.map((chapter) => (
            <div key={chapter.id}>
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
    </div>
  )
}
