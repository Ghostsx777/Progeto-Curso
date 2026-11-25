import Link from 'next/link';
export function AcademyBrand(){
 return <Link className="brand" href="/" aria-label="DevPath Academy, início">
  <img src="/academy/mark.svg" alt="" width="44" height="44"/>
  <span>DEVPATH<br/><b>ACADEMY</b></span>
 </Link>;
}
