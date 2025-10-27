import "../styles/style_index.css";

export default function Footer() {
  

  return (
    <footer>
      <div className="contact">
        <p><strong>BRNO CITY</strong></p>
        <p>Address: 602 00 Brno</p>
        <p>Tel: +420 99 87 876 890</p>
        <p>Email: info@brnocity.cz</p>
      </div>

      <div className="social">
        <h3 className="who-we-are"><a href="/about">Who we are?</a></h3>
        <a href="#"><img src="/images/facebook.png" alt="Facebook" /></a>
        <a href="#"><img src="/images/instagram (1).png" alt="Instagram" /></a>
        <a href="#"><img src="/images/tiktok.png" alt="TikTok" /></a>
      </div>
    </footer>
  );
}
