<script>
  let src1 = '/build/assets/img/appMobile.png';
  let src2 = '/build/assets/img/appWeb.png';
  let src3 = '/build/assets/img/appDesign.png';
  let src4 = '/build/assets/img/appCourse.png';

//   import '../data/data.svelte'

// import SERVICES from "../data/data.svelte";

import {SERVICES} from '../data/data'




// <Data SERVICES = {SERVICES}>



//    let SERVICES = [
//     {
//       title: 'Application mobile',
//       description:
//         ' Lorem ipsum dolor sit, amet consectetur adipisicing elit. Recusandae quam maiores eum laudantium illo, laborum architecto inventore similique dolore? Laboriosam.',
//       link: '#',
//       image: src1,
//     },
//     {
//       title: 'Application Web',
//       description:
//         ' Lorem ipsum dolor sit, amet consectetur adipisicing elit. Recusandae quam maiores eum laudantium illo, laborum architecto inventore similique dolore? Laboriosam.',
//       link: '#',
//       image: src2,
//     },
//     {
//       title: 'Web Design',
//       description:
//         ' Lorem ipsum dolor sit, amet consectetur adipisicing elit. Recusandae quam maiores eum laudantium illo, laborum architecto inventore similique dolore? Laboriosam.',
//       link: '#',
//       image: src3,
//     },
//     {
//       title: 'Cours Gratuit',
//       description:
//         ' Lorem ipsum dolor sit, amet consectetur adipisicing elit. Recusandae quam maiores eum laudantium illo, laborum architecto inventore similique dolore? Laboriosam.',
//       link: '#',
//       image: src4,
//     },
//   ];






</script>

<div class="service">
  <div class="service-title"><h1>We Offer Best Services</h1></div>

  <div class="content-categorie">
    {#each SERVICES as offeredService (offeredService.title)}
      <div class="card">
        <div class="content">
          <div class="picture">
            <img src={offeredService.image} alt="" />
          </div>
          <h1>{offeredService.title}</h1>
          <p>
            {offeredService.description}
          </p>
          <a href={offeredService.link}>Commencer</a>
        </div>
      </div>
    {/each}
  </div>
</div>

<style lang="scss">
  @import '../style/service.scss';
</style>
