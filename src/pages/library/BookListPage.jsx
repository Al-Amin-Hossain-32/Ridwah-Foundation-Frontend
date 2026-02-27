import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, BookOpen } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux'
import { fetchBooks, selectBooks, selectBookLoad } from '@/app/store/bookSlice'
import { Input }        from '@/components/ui/Input'
import { Card }         from '@/components/ui/Card'
import { CardSkeleton } from '@/components/ui/Loader'
import { EmptyState }   from '@/components/ui/EmptyState'
import { Badge }        from '@/components/ui/Badge'

export default function BookListPage() {
  const dispatch = useAppDispatch()
  const books    = useAppSelector(selectBooks)
  const loading  = useAppSelector(selectBookLoad)
  const [search, setSearch] = useState('')

  useEffect(() => {
    dispatch(fetchBooks())
  }, [dispatch])

  const filtered = books.filter((b) =>
    b.title.toLowerCase().includes(search.toLowerCase()) ||
    b.author?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="page-wrapper">
      <div className="mb-lg">
        <div className="flex items-center gap-sm mb-xs">
          <BookOpen size={22} className="text-primary" />
          <h2 className="font-heading text-text-main">Library</h2>
        </div>
        <p className="text-small text-text-secondary">
          বই পড়ুন, জ্ঞান অর্জন করুন
        </p>
      </div>

      <div className="mb-md">
        <Input
          placeholder="বইয়ের নাম বা লেখক দিয়ে খুঁজুন..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          iconLeft={<Search size={16} />}
        />
      </div>

      {loading ? (
        <CardSkeleton count={3} />
      ) : filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((book) => (
            <Link key={book._id} to={`/app/library/${book._id}`}>
              <Card className="flex gap-md items-start">
                {/* Cover */}
                <div className="w-16 h-20 bg-primary/10 rounded-[10px] flex-shrink-0 overflow-hidden">
                  {book.coverImage ? (
                    <img src={book.coverImage} alt={book.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen size={24} className="text-primary/40" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-heading font-semibold text-text-main text-[16px] leading-snug line-clamp-2">
                    {book.title}
                  </h3>
                  <p className="text-small text-text-secondary mt-xs">{book.author}</p>
                  <div className="flex items-center gap-xs mt-sm">
                    {book.genre && (
                      <Badge variant="primary" className="text-[11px]">{book.genre}</Badge>
                    )}
                    <Badge variant={book.availableCopies > 0 ? 'success' : 'danger'} className="text-[11px]">
                      {book.availableCopies > 0 ? `${book.availableCopies} copies` : 'Unavailable'}
                    </Badge>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState icon="📚" title="কোনো বই নেই" />
      )}
    </div>
  )
}
