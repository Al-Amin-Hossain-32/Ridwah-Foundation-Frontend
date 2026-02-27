import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Star, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux'
import { fetchBookById, selectBook, requestBook } from '@/app/store/bookSlice'
import { selectUser } from '@/app/store/authSlice'
import bookService from '@/services/book.service'
import { Button }    from '@/components/ui/Button'
import { Card }      from '@/components/ui/Card'
import { Avatar }    from '@/components/ui/Avatar'
import { Badge }     from '@/components/ui/Badge'
import { Textarea }  from '@/components/ui/Input'
import { Loader }    from '@/components/ui/Loader'
import { formatDate } from '@/utils/formatters'

export default function BookDetailPage() {
  const { id }   = useParams()
  const dispatch = useAppDispatch()
  const book     = useAppSelector(selectBook)
  const user     = useAppSelector(selectUser)

  const [reqLoad,    setReqLoad]    = useState(false)
  const [reviewText, setReviewText] = useState('')
  const [rating,     setRating]     = useState(5)
  const [revLoad,    setRevLoad]    = useState(false)

  useEffect(() => {
    dispatch(fetchBookById(id))
  }, [dispatch, id])

  const handleRequest = async () => {
    setReqLoad(true)
    const result = await dispatch(requestBook({ bookId: id }))
    if (requestBook.fulfilled.match(result)) {
      toast.success('Book request পাঠানো হয়েছে!')
    } else {
      toast.error('Request করা যায়নি')
    }
    setReqLoad(false)
  }

  const handleReview = async () => {
    if (!reviewText.trim()) return
    setRevLoad(true)
    try {
      await bookService.addReview(id, { text: reviewText, rating })
      toast.success('Review দেওয়া হয়েছে!')
      setReviewText('')
      dispatch(fetchBookById(id))
    } catch {
      toast.error('Review দেওয়া যায়নি')
    } finally {
      setRevLoad(false)
    }
  }

  if (!book) {
    return <div className="page-wrapper flex justify-center"><Loader size="lg" className="mt-xl" /></div>
  }

  const {
    title, author, description, coverImage,
    genre, totalCopies, availableCopies, reviews,
  } = book

  return (
    <div className="page-wrapper">
      <Link to="/app/library" className="flex items-center gap-xs text-primary mb-md font-medium text-small">
        <ArrowLeft size={16} /> Library
      </Link>

      {/* Cover + Info */}
      <div className="flex gap-md mb-lg">
        <div className="w-24 h-32 bg-primary/10 rounded-card overflow-hidden flex-shrink-0">
          {coverImage ? (
            <img src={coverImage} alt={title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl">📖</div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-heading text-text-main leading-snug mb-xs">{title}</h2>
          <p className="text-small text-text-secondary mb-sm">{author}</p>
          <div className="flex flex-wrap gap-xs">
            {genre && <Badge variant="primary">{genre}</Badge>}
            <Badge variant={availableCopies > 0 ? 'success' : 'danger'}>
              {availableCopies > 0 ? `${availableCopies}/${totalCopies} available` : 'Unavailable'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Request button */}
      {availableCopies > 0 && (
        <Button
          onClick={handleRequest}
          loading={reqLoad}
          size="full"
          variant="primary"
          className="mb-lg"
        >
          বইটি Request করুন
        </Button>
      )}

      {/* Description */}
      {description && (
        <Card className="mb-md">
          <h3 className="font-heading text-text-main mb-sm">বিস্তারিত</h3>
          <p className="text-text-secondary text-small leading-relaxed">{description}</p>
        </Card>
      )}

      {/* Reviews */}
      <div className="mb-md">
        <h3 className="font-heading text-text-main mb-sm">Reviews ({reviews?.length || 0})</h3>

        {/* Add review */}
        <Card className="mb-3">
          {/* Star rating */}
          <div className="flex gap-xs mb-sm">
            {[1,2,3,4,5].map((s) => (
              <button key={s} onClick={() => setRating(s)}>
                <Star
                  size={20}
                  fill={s <= rating ? '#F59E0B' : 'none'}
                  className={s <= rating ? 'text-donate' : 'text-gray-300'}
                />
              </button>
            ))}
          </div>
          <Textarea
            placeholder="আপনার review লিখুন..."
            rows={2}
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
          />
          <Button
            onClick={handleReview}
            loading={revLoad}
            size="sm"
            className="mt-sm"
          >
            <Send size={14} /> Submit
          </Button>
        </Card>

        {/* Review list */}
        {reviews?.map((r, i) => (
          <Card key={i} className="mb-2">
            <div className="flex items-center gap-sm mb-sm">
              <Avatar src={r.user?.avatar} name={r.user?.name} size="sm" />
              <div>
                <p className="font-medium text-text-main text-small">{r.user?.name}</p>
                <div className="flex gap-xs">
                  {[1,2,3,4,5].map((s) => (
                    <Star
                      key={s}
                      size={12}
                      fill={s <= r.rating ? '#F59E0B' : 'none'}
                      className={s <= r.rating ? 'text-donate' : 'text-gray-300'}
                    />
                  ))}
                </div>
              </div>
            </div>
            <p className="text-small text-text-secondary">{r.text}</p>
          </Card>
        ))}
      </div>
    </div>
  )
}
