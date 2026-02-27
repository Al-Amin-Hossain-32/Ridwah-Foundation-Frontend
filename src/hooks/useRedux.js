import { useDispatch, useSelector } from 'react-redux'

/**
 * Typed Redux hooks
 * সব component এ এগুলো use করো, raw useDispatch/useSelector না
 */
export const useAppDispatch = () => useDispatch()
export const useAppSelector = useSelector
