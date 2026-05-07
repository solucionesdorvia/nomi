import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#fafaf9] px-4 before:pointer-events-none before:absolute before:inset-0 before:content-[''] before:bg-[radial-gradient(ellipse_90%_55%_at_50%_-5%,rgba(255,107,53,0.1),transparent)]">
      <div className="relative z-10 flex w-full justify-center">
        <SignIn
          appearance={{
            elements: {
              card: 'shadow-lg border border-neutral-200/80',
              headerTitle: 'font-display',
            },
          }}
        />
      </div>
    </div>
  )
}
