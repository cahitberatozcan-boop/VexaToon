"use client";

import Link from "next/link";
import { useEffect, useState } from "react";


export default function WorldsStrongestSurvivor(){


const [views,setViews]=useState(0);


useEffect(()=>{

fetch("/api/series/worlds-strongest-survivor/view",{
method:"POST"
})
.then(res=>res.json())
.then(data=>{
setViews(data.views);
});


},[]);



return (

<main className="min-h-screen bg-[#111] text-white px-6 md:px-20 py-10">


<section className="
bg-[#181818]
rounded-xl
p-6
flex
flex-col
md:flex-row
gap-8
">


{/* KAPAK */}

<div className="w-56">


<img
src="/68de7f54e8983@280.jpg"
className="
rounded-lg
w-full
shadow-xl
"
/>


</div>





{/* BİLGİ */}


<div className="flex-1">


<h1 className="
text-4xl
font-bold
text-red-500
">
World's Strongest Survivor
</h1>



<div className="flex gap-2 mt-4 flex-wrap">


<span className="bg-red-600 px-3 py-1 rounded">
Manhwa
</span>

<span className="bg-zinc-700 px-3 py-1 rounded">
Aksiyon
</span>

<span className="bg-zinc-700 px-3 py-1 rounded">
Macera
</span>


</div>



<p className="
mt-6
text-zinc-300
leading-7
">

Dünya büyük bir felaket sonrası değişmiştir.
Hayatta kalanların en güçlü olmak için verdiği
mücadele anlatılmaktadır.

</p>



<Link
href="/read/worlds-strongest-survivor/1"
className="
inline-block
mt-6
bg-red-600
px-8
py-3
rounded-lg
"
>

📖 Okumaya Başla

</Link>



</div>


</section>





{/* İSTATİSTİK */}


<section className="
mt-5
bg-[#181818]
rounded-xl
grid
grid-cols-3
text-center
py-5
">


<div>

<div className="text-2xl">
👁
</div>

<p className="text-zinc-400">
Görüntülenme
</p>

<b>
{views}
</b>

</div>



<div>

<div className="text-2xl">
📖
</div>

<p className="text-zinc-400">
Okunma
</p>

<b>
0
</b>

</div>




<div>

<div className="text-2xl">
⭐
</div>

<p className="text-zinc-400">
Puan
</p>

<b className="text-yellow-400">
0.0 / 5
</b>

</div>



</section>





{/* BÖLÜMLER */}


<section className="mt-8">


<h2 className="text-2xl font-bold mb-4">
Bölümler
</h2>



<div className="space-y-3">


{[1,2,3,4,5].map(i=>(

<Link
key={i}
href={`/read/worlds-strongest-survivor/${i}`}
className="
block
bg-[#181818]
p-4
rounded-lg
hover:bg-red-600
transition
"
>

Bölüm {i}

</Link>


))}



</div>


</section>



</main>

);

}