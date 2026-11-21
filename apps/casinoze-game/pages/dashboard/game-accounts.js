/**
 * /dashboard/game-accounts → /dashboard/games?tab=mine
 *
 * Games and My Games are one page with two tabs now. This route stays so that
 * older links, bookmarks and anything still pointing at it land in the right
 * place instead of 404ing. The redirect happens on the server, so the browser
 * never renders a blank page first.
 */
export async function getServerSideProps() {
  return {
    redirect: {
      destination: '/dashboard/games?tab=mine',
      permanent: false,   // not 301: the tab may move again while this settles
    },
  }
}

export default function GameAccountsRedirect() {
  return null
}
