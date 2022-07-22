<script>
  import Fa from 'svelte-fa/src/fa.svelte';
  import {
    faCaretDown,
    faCaretUp,
  } from '@fortawesome/free-solid-svg-icons/index.es';


  import { navbar } from '../data/data';
  import { navbar_logo } from '../data/data';
 
</script>

<div class="container">
  <div class="contain-logo">
    <h1><span>Pris</span><span class="span2">ma </span></h1>
  </div>
  <div class="contain-navbar">
    <ul class="navbar">
      {#each navbar as nav (nav.id) }
            <li><a href="home">{nav.name}</a></li>
                {/each}
    </ul>
  </div>

  <div class="wrapper">
    {#each navbar_logo as logo (logo.id) }
            
         <div class="button">
            <div class="icon">
                <i class={logo.logo}></i>
            </div>
            <span>{logo.name}</span>
         </div>
                 {/each}
  </div>

  <div class="language">
    En
    <span> <Fa icon={faCaretDown} /> </span>
  </div>
</div>

<style lang="scss">
  @import '../style/navbar.scss';
</style>
