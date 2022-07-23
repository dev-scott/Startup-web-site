<script>
   import Fa from 'svelte-fa/src/fa.svelte'
 import { faCaretDown, faCaretUp } from '@fortawesome/free-solid-svg-icons/index.es'

  let src1 = '/build/person1.png';






</script>

<div class="home">



<div class="renverse"></div>












  <div class="contain-left">
    <div class="contain-left-text">
      <h1>vous revez d'avoir un <span> <br /> site web</span></h1>
      <span>
        Nous vous accompagmons dans la creation de votre site web de la meilleur
        des facons possible
      </span>
    </div>
    <div class="contain-left-begin">
      <button>commencer</button>
    </div>
  </div>

  <div class="contain-right">
    <div class="contain-right-img">
      <img src={src1} alt="" />
    </div>
    
  </div>
</div>

<style lang="scss">
  @import '../style/home.scss';
</style>
