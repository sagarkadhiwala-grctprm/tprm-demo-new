export default function Spinner({ text }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      {text && (
        <p className="text-secondary text-sm sm:text-base text-center max-w-md">
          {text}
        </p>
      )}
    </div>
  )
}
