"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

interface Mention {
  type: string;
  text: string;
  url?: string;
}

interface MentionData {
  date?: string;
  fullDate?: string;
  mentions?: Mention[];
}

interface MentionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mentionData: MentionData | null;
  showMentionsOnChart: boolean;
  onShowMentionsChange: (checked: boolean) => void;
}

export function MentionsDialog({
  open,
  onOpenChange,
  mentionData,
  showMentionsOnChart,
  onShowMentionsChange,
}: MentionsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-dvh w-full max-w-md flex-col overflow-hidden bg-gray-100 p-0 md:h-[65vh] md:rounded-xl">
        <DialogHeader className="mb-2 flex items-center justify-between border-b border-gray-200 bg-white px-4 pt-4">
          <DialogTitle className="text-textSecondary text-sm font-medium uppercase tracking-wider">
            {mentionData?.fullDate || mentionData?.date}
          </DialogTitle>
          <Button
            onClick={() => onOpenChange(false)}
            variant="ghost"
            size="icon"
            className="h-8 w-8"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-x size-5 md:size-4"
            >
              <path d="M18 6 6 18"></path>
              <path d="m6 6 12 12"></path>
            </svg>
          </Button>
        </DialogHeader>
        <div className="relative flex flex-1 flex-col overflow-hidden px-3">
          <Tabs defaultValue="mentions" className="flex flex-1 flex-col">
            <TabsList className="hidden w-full grid-cols-3 rounded-xl bg-gray-200/50 p-1 shadow-inner">
              <TabsTrigger
                value="notes"
                className="flex cursor-pointer select-none items-center justify-center rounded-lg px-2 py-1.5 text-sm font-medium text-textSecondary"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  className="mr-1.5 size-4 shrink-0 max-sm:hidden"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 2a1.5 1.5 0 0 0-1.5 1.5v9A1.5 1.5 0 0 0 4 14h8a1.5 1.5 0 0 0 1.5-1.5V6.621a1.5 1.5 0 0 1-.44-1.06L9.94 2.439A1.5 1.5 0 0 0 8.878 2H4Zm1 5.75A.75.75 0 0 1 5.75 7h4.5a.75.75 0 0 1 0 1.5h-4.5A.75.75 0 0 1 5 7.75Zm0 3a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1-.75-.75Z"
                    clipRule="evenodd"
                  ></path>
                </svg>
                Notes (0)
              </TabsTrigger>
              <TabsTrigger
                value="mentions"
                className="flex cursor-pointer select-none items-center justify-center rounded-lg px-2 py-1.5 text-sm font-medium text-textPrimary animate-popup bg-white shadow"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  className="mr-1.5 size-4 shrink-0 max-sm:hidden"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 2C4.262 2 1 4.57 1 8c0 1.86.98 3.486 2.455 4.566a3.472 3.472 0 0 1-.469 1.26.75.75 0 0 0 .713 1.14 6.961 6.961 0 0 0 3.06-1.06c.403.062.818.094 1.241.094 3.738 0 7-2.57 7-6s-3.262-6-7-6ZM5 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm7-1a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM8 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
                    clipRule="evenodd"
                  ></path>
                </svg>
                Mentions ({mentionData?.mentions?.length || 0})
              </TabsTrigger>
              <TabsTrigger
                value="commits"
                className="flex cursor-pointer select-none items-center justify-center rounded-lg px-2 py-1.5 text-sm font-medium text-textSecondary"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-1 size-4 shrink-0 max-sm:hidden"
                >
                  <circle cx="12" cy="12" r="3"></circle>
                  <line x1="3" x2="9" y1="12" y2="12"></line>
                  <line x1="15" x2="21" y1="12" y2="12"></line>
                </svg>
                Commits (0)
              </TabsTrigger>
            </TabsList>
            <div className="pointer-events-none absolute -bottom-4 left-0 right-0 z-10 h-4 bg-gradient-to-b from-gray-100 via-gray-100/80 to-transparent"></div>
            <div className="relative flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto">
                <TabsContent value="mentions" className="p-4 pb-8 m-0 flex-1">
                  <div className="-mx-1 space-y-3 px-1">
                    {mentionData?.mentions?.map((mention, idx) => (
                      <div key={idx} className="custom-card">
                        <div className="flex items-start gap-3 p-4">
                          {mention.type === "profile" ? (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center shrink-0 text-white font-semibold">
                              {mention.text?.charAt(0)?.toUpperCase() || "?"}
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="text-textSecondary"
                              >
                                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                              </svg>
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="text-sm text-textPrimary leading-relaxed">
                              {mention.text}
                              {mention.url && (
                                <a
                                  href={mention.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline ml-1"
                                >
                                  {mention.url}
                                </a>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {(!mentionData?.mentions ||
                      mentionData.mentions.length === 0) && (
                      <div className="text-center py-8 text-textSecondary">
                        No mentions for this date
                      </div>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="notes" className="p-4 pb-8 m-0">
                  <div className="text-center py-8 text-textSecondary">
                    No notes for this date
                  </div>
                </TabsContent>
                <TabsContent value="commits" className="p-4 pb-8 m-0">
                  <div className="text-center py-8 text-textSecondary">
                    No commits for this date
                  </div>
                </TabsContent>
              </div>
            </div>
          </Tabs>
        </div>
        <div className="shrink-0 border-t border-gray-200 bg-white px-2 py-1">
          <label className="flex cursor-pointer items-center justify-start gap-2 px-2 py-2">
            <Switch
              checked={showMentionsOnChart}
              onCheckedChange={onShowMentionsChange}
            />
            <span className="text-xs text-textPrimary">
              Show mentions on chart
            </span>
          </label>
        </div>
      </DialogContent>
    </Dialog>
  );
}
