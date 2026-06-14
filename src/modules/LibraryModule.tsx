import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Filter, Grid, CheckCircle2, Edit3, MoreHorizontal, Plus, X, Bold, Italic, Link as LinkIcon, AlertTriangle, MenuSquare, Quote } from 'lucide-react';
import { useStore } from '../useStore';
import { STORES } from '../db';
import { FormModal } from '../components/FormModal';
import { ConfirmModal } from '../components/ConfirmModal';

interface Book {
  id?: number;
  title: string;
  author: string;
  img: string;
  progress: number;
  completed: boolean;
  color?: string;
  currentlyReading?: boolean;
}

interface Passage {
  id?: number;
  text: string;
  source: string;
  color: string;
}

export function LibraryModule() {
  const [books, bookActions, booksLoading] = useStore<Book>(STORES.libraryBooks);
  const [passages, passageActions, passagesLoading] = useStore<Passage>(STORES.libraryPassages);

  const [showAddBook, setShowAddBook] = useState(false);
  const [showLogPages, setShowLogPages] = useState(false);
  const [passageText, setPassageText] = useState('');
  const [passageSource, setPassageSource] = useState('');
  
  // UX Enhancements States
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);
  const [passageToDelete, setPassageToDelete] = useState<number | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'read' | 'unread'>('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const currentlyReading = useMemo(() => books.find(b => b.currentlyReading), [books]);

  const booksReadCount = useMemo(() => books.filter(b => b.completed).length, [books]);
  const pagesTotalEstimate = useMemo(() => {
    return books.reduce((sum, b) => sum + Math.round(300 * (b.progress / 100)), 0);
  }, [books]);

  const loading = booksLoading || passagesLoading;

  const handleAddBook = (data: Record<string, string | number>) => {
    bookActions.add({
      title: data.title as string,
      author: data.author as string,
      img: (data.img as string) || '',
      progress: 0,
      completed: false,
      color: 'bg-primary',
      currentlyReading: false,
    });
  };

  const confirmDeleteBook = () => {
    if (bookToDelete?.id) {
      bookActions.remove(bookToDelete.id);
      setBookToDelete(null);
    }
  };

  const confirmDeletePassage = () => {
    if (passageToDelete) {
      passageActions.remove(passageToDelete);
      setPassageToDelete(null);
    }
  };

  const handleSavePassage = () => {
    if (!passageText.trim()) return;
    passageActions.add({
      text: passageText.trim(),
      source: passageSource.trim() || 'Unknown source',
      color: ['primary', 'secondary', 'tertiary'][passages.length % 3],
    });
    setPassageText('');
    setPassageSource('');
  };

  const handleLogPages = (data: Record<string, string | number>) => {
    if (!currentlyReading?.id) return;
    const newProgress = Math.min(100, Number(data.progress) || 0);
    bookActions.update(currentlyReading.id, {
      progress: newProgress,
      completed: newProgress >= 100,
    });
  };

  const handleSetCurrentlyReading = (bookId: number) => {
    books.forEach(b => {
      if (b.id && b.currentlyReading) {
        bookActions.update(b.id, { currentlyReading: false });
      }
    });
    bookActions.update(bookId, { currentlyReading: true });
  };

  if (loading) {
    return (
      <div className="max-w-[1400px] w-full mx-auto flex flex-col h-full gap-8 items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-on-surface-variant text-[14px] uppercase tracking-widest font-semibold">Loading Library…</p>
        </div>
      </div>
    );
  }

  // Collection filtering logic
  const collectionBooks = books
    .filter(b => !b.currentlyReading)
    .filter(b => {
      if (filterMode === 'read') return b.completed;
      if (filterMode === 'unread') return !b.completed;
      return true;
    });

  const borderColorMap: Record<string, string> = {
    primary: 'border-primary/30 hover:border-primary',
    secondary: 'border-secondary/30 hover:border-secondary',
    tertiary: 'border-tertiary/30 hover:border-tertiary',
  };

  const dotColorMap: Record<string, string> = {
    primary: 'bg-primary shadow-[0_0_8px_rgba(255,180,166,0.8)]',
    secondary: 'bg-secondary shadow-[0_0_8px_rgba(192,193,255,0.8)]',
    tertiary: 'bg-tertiary shadow-[0_0_8px_rgba(137,206,255,0.8)]',
  };

  return (
    <>
      <div 
        className="fixed inset-0 z-[-2] bg-cover bg-center opacity-30 mix-blend-screen"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=2690&auto=format&fit=crop')" }}
      />
      <div className="fixed inset-0 z-[-1] bg-gradient-to-t from-background via-background/90 to-background/50 pointer-events-none"></div>

      <div className="max-w-[1400px] w-full mx-auto flex flex-col h-full gap-8 relative z-0">
      {/* Abstract Mesh Background */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/20 rounded-full blur-[120px] pointer-events-none -z-10 mix-blend-screen"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none -z-10 mix-blend-screen"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-tertiary/10 rounded-full blur-[150px] pointer-events-none -z-10 mix-blend-screen"></div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-4">
        <div>
          <h2 className="text-[64px] font-bold text-on-surface tracking-tight leading-none mb-4">Library</h2>
          <p className="text-[18px] text-on-surface-variant">Your digital sanctuary of knowledge.</p>
        </div>
        <div className="flex gap-8 bg-surface-container/50 px-8 py-4 rounded-2xl border border-white/5 backdrop-blur-md">
          <div className="text-right">
            <p className="text-[12px] font-semibold text-on-surface-variant uppercase tracking-widest mb-1">Books Read</p>
            <p className="text-[32px] font-bold text-primary leading-none">{booksReadCount}</p>
          </div>
          <div className="w-px bg-white/10 h-12 self-center"></div>
          <div className="text-right">
            <p className="text-[12px] font-semibold text-on-surface-variant uppercase tracking-widest mb-1">Pages Turned</p>
            <p className="text-[32px] font-bold text-tertiary leading-none">{pagesTotalEstimate.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 flex-1">
        <div className="xl:col-span-8 flex flex-col gap-8">
          {currentlyReading ? (
            <div className="glass-card rounded-[32px] p-8 flex flex-col md:flex-row gap-10 relative overflow-hidden group shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

              <div className="w-40 md:w-56 shrink-0 rounded-xl overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.4)] relative z-10 border border-white/10 group-hover:scale-105 transition-transform duration-500">
                {currentlyReading.img ? (
                  <img
                    src={currentlyReading.img}
                    alt="Book cover"
                    className="w-full h-full object-cover aspect-[2/3] filter saturate-50 contrast-125 hover:saturate-100 transition-all duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-surface-container-highest flex items-center justify-center p-4 text-center aspect-[2/3]">
                    <span className="text-[20px] text-on-surface/70 font-semibold leading-tight">{currentlyReading.title}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-primary/10 mix-blend-overlay"></div>
              </div>

              <div className="flex-1 flex flex-col justify-center z-10">
                <span className="inline-block px-4 py-1.5 bg-surface-variant text-secondary text-[10px] rounded-full uppercase tracking-widest font-bold w-fit mb-6 border border-white/10 shadow-sm">Currently Reading</span>

                <h3 className="text-[32px] font-medium text-on-surface mb-2 leading-tight">{currentlyReading.title}</h3>
                <p className="text-[18px] text-on-surface-variant mb-10">{currentlyReading.author}</p>

                <div className="mt-auto bg-surface-container-low/50 p-6 rounded-2xl border border-white/5">
                  <div className="flex justify-between items-end mb-3">
                    <span className="text-[12px] font-semibold text-on-surface-variant uppercase tracking-widest">Progress</span>
                    <span className="text-[16px] text-primary font-bold">{currentlyReading.progress}% <span className="text-sm text-on-surface-variant font-normal">/ p. {Math.round(300 * currentlyReading.progress / 100)} of 300</span></span>
                  </div>
                  <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary to-secondary rounded-full relative shadow-[0_0_10px_rgba(255,180,166,0.5)]" style={{width: `${currentlyReading.progress}%`}}>
                      <div className="absolute right-0 top-0 w-4 h-full bg-white/50 blur-[4px]"></div>
                    </div>
                  </div>

                  <div className="mt-8 flex gap-4">
                    <button
                      onClick={() => setShowLogPages(true)}
                      className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-on-surface text-[12px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 shadow-sm"
                    >
                      <Edit3 className="w-4 h-4" /> Log Pages
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card rounded-[32px] p-8 flex items-center justify-center min-h-[200px] shadow-xl">
              <p className="text-on-surface-variant text-[16px]">No book currently being read. Set one from your collection.</p>
            </div>
          )}

          <div className="flex-1">
            <div className="flex justify-between items-center mb-8 relative z-30">
              <h3 className="text-[32px] font-medium text-on-surface">Collection</h3>
              <div className="flex gap-2 relative">
                <button 
                  onClick={() => setShowFilterMenu(!showFilterMenu)}
                  className={`p-3 rounded-xl transition-colors border shadow-sm relative z-30 ${filterMode !== 'all' ? 'bg-primary/20 border-primary/50 text-primary' : 'bg-surface-container hover:bg-surface-container-high border-white/5 text-on-surface'}`}
                >
                  <Filter className="w-5 h-5"/>
                </button>
                <button className="p-3 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors border border-white/5 shadow-sm"><Grid className="w-5 h-5"/></button>
                
                {/* Filter Dropdown */}
                <AnimatePresence>
                  {showFilterMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-12 top-14 bg-surface-container-high/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-2 w-40 z-40"
                    >
                      {(['all', 'read', 'unread'] as const).map(mode => (
                        <button
                          key={mode}
                          onClick={() => { setFilterMode(mode); setShowFilterMenu(false); }}
                          className={`w-full text-left px-4 py-2.5 rounded-xl text-[14px] font-medium transition-colors ${filterMode === mode ? 'bg-primary/20 text-primary' : 'text-on-surface hover:bg-white/5'}`}
                        >
                          {mode.charAt(0).toUpperCase() + mode.slice(1)}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {collectionBooks.map((book) => (
                <div key={book.id} className="group cursor-pointer flex flex-col relative z-10">
                  {/* Action buttons on hover */}
                  <div className="absolute -top-3 -right-3 z-30 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); if (book.id) handleSetCurrentlyReading(book.id); }}
                      className="w-8 h-8 rounded-full bg-secondary hover:bg-secondary-container text-on-secondary hover:scale-110 transition-transform flex items-center justify-center shadow-[0_4px_15px_rgba(192,193,255,0.4)]"
                      title="Set as Currently Reading"
                    >
                      <MenuSquare className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setBookToDelete(book); }}
                      className="w-8 h-8 rounded-full bg-error hover:bg-error-container text-on-error hover:scale-110 transition-transform flex items-center justify-center shadow-[0_4px_15px_rgba(255,180,171,0.4)]"
                      title="Delete book"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div
                    className="relative rounded-xl overflow-hidden shadow-lg border border-white/10 aspect-[2/3] mb-4 transition-all duration-500 group-hover:-translate-y-2 group-hover:shadow-[0_15px_30px_rgba(0,0,0,0.4)]"
                    onDoubleClick={() => { if (book.id) handleSetCurrentlyReading(book.id); }}
                    title="Double-click to set as Currently Reading"
                  >
                    {book.img ? (
                       <img src={book.img} className="w-full h-full object-cover filter saturate-50 contrast-125 group-hover:saturate-100 transition-all duration-500" />
                    ) : (
                       <div className="w-full h-full bg-surface-container-highest flex items-center justify-center p-4 text-center border-t border-l border-white/5 bg-gradient-to-br from-surface to-surface-container">
                         <span className="text-[20px] text-on-surface/70 font-semibold leading-tight">{book.title}</span>
                       </div>
                    )}

                    {book.completed && (
                      <div className="absolute inset-0 bg-background/50 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <CheckCircle2 className="w-12 h-12 text-primary drop-shadow-lg" />
                      </div>
                    )}

                    {book.progress > 0 && book.progress < 100 && !book.completed && (
                      <div className="absolute bottom-0 left-0 w-full h-1.5 bg-surface-container-high/80">
                         <div className={`h-full ${book.color || 'bg-primary'}`} style={{width: `${book.progress}%`}}></div>
                      </div>
                    )}
                  </div>
                  <h4 className="text-[16px] font-medium text-on-surface truncate px-1 group-hover:text-primary transition-colors">{book.title}</h4>
                  <p className="text-[12px] font-medium text-on-surface-variant truncate px-1 mt-1">{book.author}</p>
                </div>
              ))}

              <div className="group cursor-pointer flex flex-col z-10" onClick={() => setShowAddBook(true)}>
                <div className="relative rounded-xl overflow-hidden border-2 border-white/10 border-dashed aspect-[2/3] mb-4 flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors hover:border-primary/50">
                  <Plus className="w-10 h-10 text-on-surface-variant group-hover:text-primary transition-colors group-hover:scale-110" />
                </div>
                <h4 className="text-[16px] font-medium text-on-surface-variant text-center mt-2 group-hover:text-on-surface transition-colors">Add Book</h4>
              </div>
            </div>
          </div>
        </div>

        <div className="xl:col-span-4 h-full min-h-[600px] flex flex-col">
          <div className="glass-card rounded-[32px] h-full p-8 flex flex-col border border-outline/20 shadow-xl relative overflow-hidden">
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-tertiary/10 blur-[80px] pointer-events-none rounded-full"></div>
            
            <div className="flex justify-between items-center mb-8 relative z-10">
              <div className="flex items-center gap-3">
                <Quote className="text-tertiary w-7 h-7" fill="currentColor" />
                <h3 className="text-[24px] font-medium text-on-surface">Passages</h3>
              </div>
              <button className="text-on-surface-variant hover:text-on-surface p-2 bg-surface-container rounded-lg"><MoreHorizontal className="w-5 h-5"/></button>
            </div>

            <div className="flex-1 overflow-y-auto pr-4 space-y-8 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent relative z-10">
              {passages.length === 0 && (
                <p className="text-on-surface-variant text-[14px] text-center py-8">No passages saved yet. Capture a thought below.</p>
              )}
              {passages.map((passage) => (
                <div key={passage.id} className={`group relative pl-6 border-l-2 ${borderColorMap[passage.color] || 'border-primary/30 hover:border-primary'} transition-colors`}>
                  {/* Delete button on hover */}
                  <button
                    onClick={() => setPassageToDelete(passage.id || null)}
                    className="absolute -top-2 -right-2 z-20 w-6 h-6 rounded-full bg-red-500/80 hover:bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <p className="text-[18px] text-on-surface/90 italic leading-relaxed">
                    "{passage.text}"
                  </p>
                  <p className="text-[12px] font-semibold text-on-surface-variant mt-4 flex items-center gap-2 uppercase tracking-widest">
                    <span className={`w-2 h-2 rounded-full ${dotColorMap[passage.color] || 'bg-primary shadow-[0_0_8px_rgba(255,180,166,0.8)]'}`}></span>
                    {passage.source}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 relative z-10">
              <textarea
                className="w-full bg-surface-container/30 border border-white/5 rounded-xl resize-none focus:ring-0 focus:border-primary/50 focus:bg-surface-container transition-colors text-on-surface text-[16px] placeholder-on-surface-variant/50 h-32 p-4 mb-2 backdrop-blur-sm shadow-inner"
                placeholder="Capture a thought or quote..."
                value={passageText}
                onChange={(e) => setPassageText(e.target.value)}
              ></textarea>
              <input
                className="w-full bg-surface-container/30 border border-white/5 rounded-xl focus:ring-0 focus:border-primary/50 focus:bg-surface-container transition-colors text-on-surface text-[14px] placeholder-on-surface-variant/50 p-3 mb-4 backdrop-blur-sm shadow-inner"
                placeholder="Source (e.g. Deep Work, p. 44)"
                value={passageSource}
                onChange={(e) => setPassageSource(e.target.value)}
              />
              <div className="flex justify-between items-center px-2">
                <div className="flex gap-2 text-on-surface-variant">
                  <button className="hover:text-primary hover:bg-white/5 rounded-md transition-colors p-2"><Bold className="w-4 h-4"/></button>
                  <button className="hover:text-primary hover:bg-white/5 rounded-md transition-colors p-2"><Italic className="w-4 h-4"/></button>
                  <button className="hover:text-primary hover:bg-white/5 rounded-md transition-colors p-2"><LinkIcon className="w-4 h-4"/></button>
                </div>
                <button
                  onClick={handleSavePassage}
                  className="px-6 py-2.5 bg-white/10 rounded-lg text-[12px] font-bold uppercase tracking-widest text-on-surface hover:bg-white/20 transition-colors shadow-sm border border-white/5"
                >Save</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal 
        isOpen={bookToDelete !== null}
        onClose={() => setBookToDelete(null)}
        onConfirm={confirmDeleteBook}
        title="Delete Book"
        message={`Are you sure you want to permanently delete "${bookToDelete?.title}"? This action cannot be undone.`}
      />

      <ConfirmModal 
        isOpen={passageToDelete !== null}
        onClose={() => setPassageToDelete(null)}
        onConfirm={confirmDeletePassage}
        title="Delete Passage"
        message="Are you sure you want to permanently delete this passage? This action cannot be undone."
      />

      <FormModal
        isOpen={showAddBook}
        onClose={() => setShowAddBook(false)}
        onSubmit={handleAddBook}
        title="Add Book"
        fields={[
          { name: 'title', label: 'Title', type: 'text', required: true, placeholder: 'Book title...' },
          { name: 'author', label: 'Author', type: 'text', required: true, placeholder: 'Author name...' },
          { name: 'img', label: 'Cover Image', type: 'url', placeholder: 'Cover image URL (optional)' },
        ]}
      />

      <FormModal
        isOpen={showLogPages}
        onClose={() => setShowLogPages(false)}
        onSubmit={handleLogPages}
        title="Log Pages"
        submitLabel="Update"
        fields={[
          {
            name: 'progress',
            label: 'Progress (%)',
            type: 'number',
            required: true,
            placeholder: 'Enter progress percentage (0-100)',
            defaultValue: currentlyReading?.progress ?? 0,
          },
        ]}
      />
      </div>
    </>
  );
}
