"use client";

import { Share2, Printer, Plus, Edit3, Trash2, Menu, Play, FileText, Calendar, X, Type } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface SetListItem {
  id: string;
  type: 'music' | 'guide';
  title: string;
  duration: string;
  note: string;
}

export default function SetList() {
  const [isMounted, setIsMounted] = useState(false);
  const [items, setItems] = useState<SetListItem[]>([
    { id: '1', type: 'music', title: '내 영혼이 은총 입어', duration: '5:00', note: 'Verse-Chorus-Bridge-Chorus' },
    { id: '2', type: 'guide', title: '예배 안내 및 대표 기도', duration: '3:00', note: 'Pad Pad 배경음악' }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SetListItem | null>(null);
  const [teleprompterItem, setTeleprompterItem] = useState<SetListItem | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const newItems = Array.from(items);
    const [reorderedItem] = newItems.splice(result.source.index, 1);
    newItems.splice(result.destination.index, 0, reorderedItem);
    
    setItems(newItems);
  };

  const deleteItem = (id: string) => {
    if (confirm("정말 이 항목을 삭제하시겠습니까?")) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const openModal = (item?: SetListItem) => {
    if (item) {
      setEditingItem(item);
    } else {
      setEditingItem({ id: Date.now().toString(), type: 'music', title: '', duration: '', note: '' });
    }
    setIsModalOpen(true);
  };

  const saveItem = () => {
    if (!editingItem) return;
    if (items.find(i => i.id === editingItem.id)) {
      setItems(items.map(i => i.id === editingItem.id ? editingItem : i));
    } else {
      setItems([...items, editingItem]);
    }
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const exportPDF = async () => {
    if (!printRef.current) return;
    
    try {
      const element = printRef.current;
      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('setlist.pdf');
    } catch (e) {
      console.error("PDF Export failed", e);
      alert("PDF 출력 중 문제가 발생했습니다.");
    }
  };

  if (!isMounted) return <div className="min-h-screen" />;

  return (
    <div className="pt-32 px-6 max-w-7xl mx-auto mb-20">
      {/* 텔레프롬프터 뷰 (전체화면 오버레이) */}
      {teleprompterItem && (
        <div className="fixed inset-0 z-50 bg-[#2D2926] text-[#F9F8F6] flex flex-col p-10 overflow-y-auto">
           <div className="flex justify-between items-center mb-10 shrink-0">
             <div className="flex items-center gap-4">
               <span className="px-4 py-1.5 rounded-full bg-[#E6C79C] text-[#2D2926] font-bold text-sm uppercase">
                 {teleprompterItem.type}
               </span>
               <h1 className="text-3xl font-handwriting">{teleprompterItem.title}</h1>
             </div>
             <button onClick={() => setTeleprompterItem(null)} className="p-4 hover:bg-white/10 rounded-full transition-colors">
               <X size={32} />
             </button>
           </div>
           
           <div className="flex-1 flex items-center justify-center">
             <div className="max-w-4xl text-center space-y-8">
               <p className="text-4xl md:text-6xl font-light leading-snug">
                 {teleprompterItem.note || '내용이 없습니다.'}
               </p>
               <div className="text-xl md:text-2xl text-white/50 pt-10">
                 Duration: {teleprompterItem.duration || 'N/A'}
               </div>
             </div>
           </div>
        </div>
      )}

      {/* 아이템 에디터 모달 */}
      {isModalOpen && editingItem && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-[#FAF9F6] w-full max-w-md rounded-3xl p-8 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 p-2 rounded-full hover:bg-black/5 text-[#78716A]">
              <X size={20} />
            </button>
            <h3 className="text-2xl font-handwriting mb-6 text-[#2D2926]">
              {items.find(i => i.id === editingItem.id) ? '순서 편집' : '새 순서 추가'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#78716A] mb-1">타입</label>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setEditingItem({...editingItem, type: 'music'})}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition-colors ${editingItem.type === 'music' ? 'bg-[#2D2926] text-white' : 'bg-black/5 text-[#78716A] hover:bg-black/10'}`}
                  >Music</button>
                  <button 
                    onClick={() => setEditingItem({...editingItem, type: 'guide'})}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition-colors ${editingItem.type === 'guide' ? 'bg-[#E6C79C] text-[#2D2926]' : 'bg-black/5 text-[#78716A] hover:bg-black/10'}`}
                  >Guide</button>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-[#78716A] mb-1">제목</label>
                <input 
                  type="text" 
                  value={editingItem.title} 
                  onChange={e => setEditingItem({...editingItem, title: e.target.value})}
                  className="w-full bg-white border border-black/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#E6C79C] transition-colors"
                  placeholder="예) 놀라운 주의 사랑"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#78716A] mb-1">소요 시간</label>
                <input 
                  type="text" 
                  value={editingItem.duration} 
                  onChange={e => setEditingItem({...editingItem, duration: e.target.value})}
                  className="w-full bg-white border border-black/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#E6C79C] transition-colors"
                  placeholder="예) 5:00"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#78716A] mb-1">메모 / 내용</label>
                <textarea 
                  value={editingItem.note} 
                  onChange={e => setEditingItem({...editingItem, note: e.target.value})}
                  className="w-full bg-white border border-black/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#E6C79C] transition-colors h-24 resize-none"
                  placeholder="진행 메모나 가사를 입력하세요"
                />
              </div>

              <button 
                onClick={saveItem}
                disabled={!editingItem.title}
                className="w-full mt-4 bg-[#2D2926] text-white rounded-xl py-4 font-bold text-sm hover:bg-black/80 transition-colors disabled:opacity-50"
              >
                저장하기
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white rounded-ibig p-10 shadow-sm border border-[#78716A]/10" ref={printRef}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 print-header">
              <h2 className="text-4xl font-handwriting">스마트 셋리스트</h2>
              <div className="flex gap-2">
                <button 
                  onClick={() => alert("공유 링크가 클립보드에 복사되었습니다. (구현 예정)")}
                  className="p-3 bg-[#FAF9F6] rounded-full hover:bg-[#E6C79C]/20 transition-all text-[#2D2926]" 
                  title="공유하기"
                >
                  <Share2 size={20}/>
                </button>
                <button 
                  onClick={exportPDF}
                  className="p-3 bg-[#FAF9F6] rounded-full hover:bg-[#E6C79C]/20 transition-all text-[#2D2926]" 
                  title="출력하기"
                >
                  <Printer size={20}/>
                </button>
                <button 
                  onClick={() => openModal()}
                  className="bg-[#2D2926] text-white px-6 py-3 rounded-full text-xs font-bold flex items-center gap-2 hover:bg-[#78716A] transition-colors"
                >
                  <Plus size={16}/> 새 순서 추가
                </button>
              </div>
            </div>
            
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="setlist-items">
                {(provided) => (
                  <div 
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-4"
                  >
                    {items.map((item, idx) => (
                      <Draggable key={item.id} draggableId={item.id} index={idx}>
                        {(provided, snapshot) => (
                          <div 
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`flex items-center gap-6 bg-[#FAF9F6] p-6 rounded-2xl border transition-all group ${
                              snapshot.isDragging ? 'shadow-lg border-[#E6C79C]' : 'border-transparent hover:border-black/5'
                            }`}
                          >
                            <div className="text-2xl font-handwriting text-[#E6C79C] w-8 shrink-0">{idx + 1}</div>
                            
                            <div className="flex-1 cursor-pointer" onClick={() => openModal(item)}>
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase shrink-0 ${item.type === 'music' ? 'bg-[#2D2926] text-white' : 'bg-[#E6C79C] text-[#2D2926]'}`}>
                                  {item.type}
                                </span>
                                <span className="font-bold cursor-text line-clamp-1">{item.title}</span>
                                <span className="text-[10px] text-[#78716A] ml-2 shrink-0">{item.duration}</span>
                              </div>
                              <p className="text-xs text-[#78716A] italic font-light line-clamp-2">{item.note}</p>
                            </div>
                            
                            <div className="flex items-center gap-2 lg:gap-4 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => setTeleprompterItem(item)}
                                className="p-2 text-[#E6C79C] hover:bg-[#E6C79C]/10 rounded-full transition-colors"
                                title="프롬프터 뷰"
                              >
                                <Type size={18} />
                              </button>
                              <button 
                                onClick={() => deleteItem(item.id)}
                                className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                              >
                                <Trash2 size={18} />
                              </button>
                              <div 
                                {...provided.dragHandleProps}
                                className="p-2 text-[#78716A] hover:bg-black/5 rounded-full cursor-grab active:cursor-grabbing"
                              >
                                <Menu size={18} />
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
            {items.length === 0 && (
              <div className="py-20 text-center text-[#78716A]">
                <p className="font-handwriting text-2xl mb-2">텅 비어있네요!</p>
                <p className="text-sm">우측 상단의 버튼을 눌러 새 순서를 추가해보세요.</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#2D2926] text-white rounded-ibig p-8 shadow-2xl relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="font-handwriting text-2xl mb-2 text-[#E6C79C]">Worship Practice</h3>
              <p className="text-xs text-white/50 mb-8 font-light">셋리스트의 음원들을 차례대로 연습하세요.</p>
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {items.filter(i => i.type === 'music').map(i => (
                  <div key={i.id} className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10 hover:bg-white/10 cursor-pointer transition-all">
                    <div className="w-10 h-10 shrink-0 rounded-full bg-[#E6C79C] flex items-center justify-center text-[#2D2926]">
                      <Play size={16} fill="currentColor" className="ml-0.5"/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{i.title}</p>
                      <p className="text-[10px] text-white/40 truncate">{i.note}</p>
                    </div>
                  </div>
                ))}
                {items.filter(i => i.type === 'music').length === 0 && (
                  <p className="text-sm text-white/40 text-center py-4">연습할 음원이 없습니다.</p>
                )}
              </div>
              <button 
                disabled={items.filter(i => i.type === 'music').length === 0}
                className="w-full mt-8 py-4 bg-white/10 rounded-2xl text-xs font-bold hover:bg-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                전체 자동 재생
              </button>
            </div>
            <svg className="absolute -bottom-10 -right-10 opacity-5" width="200" height="200" viewBox="0 0 100 100">
              <path d="M0 50 Q25 0 50 50 T100 50" stroke="white" strokeWidth="2" fill="none" />
            </svg>
          </div>

          <div className="bg-white rounded-ibig p-8 shadow-sm border border-[#78716A]/10">
            <h3 className="font-handwriting text-xl mb-6">마스터 플랜 공유</h3>
            <div className="space-y-3">
               <button onClick={() => alert("공유 모달 오픈")} className="w-full p-4 bg-[#FAF9F6] rounded-2xl flex items-center gap-3 text-xs font-bold hover:bg-[#E6C79C]/10 transition-all text-[#78716A]">
                 <Share2 size={16}/> 팀원에게 링크 보내기
               </button>
               <button onClick={exportPDF} className="w-full p-4 bg-[#FAF9F6] rounded-2xl flex items-center gap-3 text-xs font-bold hover:bg-[#E6C79C]/10 transition-all text-[#78716A]">
                 <FileText size={16}/> 큐시트 PDF 내보내기
               </button>
               <button className="w-full p-4 bg-[#FAF9F6] rounded-2xl flex items-center gap-3 text-xs font-bold hover:bg-[#E6C79C]/10 transition-all text-[#78716A]">
                 <Calendar size={16}/> 구글 캘린더 연동
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
