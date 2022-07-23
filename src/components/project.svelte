<script>
  import Fa from 'svelte-fa/src/fa.svelte';
  import {
    faCaretDown,
    faCaretUp,
  } from '@fortawesome/free-solid-svg-icons/index.es';

  let src1 = '/build/verifier.png';
  let src2 = '/build/reverifier.png';

  let src3 = '/build/man.png';

  let src4 = '/build/countries.png';



</script>

<div class="project">





<!-- <div class="cuve"></div> -->








  <div class="project-title">
    <h1>
      Nous avons réalisé plus de 1200 projets par an <br /> Réussir et compter
    </h1>

    <p class="project-paragraphe">
      Nous aidons chaque annees des centaines <br />
      d'entreprise a hemerger dans le domaine de la technologie , et ce travail travail
      vas de la conception au suivit continu
    </p>
  </div>
  <div class="card">
    <div class="card-project">
      <div class="card-project-img"><img src={src1} alt="" /></div>
      <div class="card-project-text">
        <h1><span> 100+ </span> <br /> Project completed</h1>
      </div>
    </div>
    <div class="card-project">
      <div class="card-project-img"><img src={src2} alt="" /></div>
      <div class="card-project-text">
        <h1><span>100+ </span> <br /> Active Project</h1>
      </div>
    </div>
    <div class="card-project">
      <div class="card-project-img"><img src={src3} alt="" /></div>
      <div class="card-project-text">
        <h1><span> 90+</span> <br /> Client Satisfied</h1>
      </div>
    </div>
    <div class="card-project">
      <div class="card-project-img"><img src={src4} alt="" /></div>
      <div class="card-project-text">
        <h1><span>56+ </span> <br /> Country Available</h1>
      </div>
    </div>
  </div>
</div>

<style lang="scss">
  @import '../style/project.scss';
</style>
