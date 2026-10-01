export function Loader({ cards = 3 }: { cards?: number }) {
  return <div className="skeleton-list" aria-label="Загрузка">{Array.from({ length: cards }, (_, index) => <div className="skeleton-card" key={index}><span /><div><i /><i /><i /></div></div>)}</div>;
}

export function ErrorState({ title, message, onRetry }: { title: string; message: string; onRetry: () => void }) {
  return <div className="state-card"><span className="state-code">!</span><h2>{title}</h2><p>{message}</p><button className="button button--primary" onClick={onRetry}>Повторить</button></div>;
}
